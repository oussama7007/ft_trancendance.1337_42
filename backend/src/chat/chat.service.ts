import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

import { Conversation } from './entities/conversation.entity.js';
import { Message } from './entities/message.entity.js';
import type { MessageType } from './entities/message.entity.js';
import { InterestRequest, InterestRequestStatus } from './entities/interest-request.entity.js';
import { User } from '../auth/user.entity.js';
import { Listing } from '../listings/listing.entity.js';
import { PresenceService } from './presence.service.js';
import { RateLimiter } from './rate-limiter.js';
import {
  ALLOWED_TYPES,
  MAX_SIZE_BY_KIND,
  normalizeMimeType,
  sanitizeFileName,
} from './chat-files.js';
import {
  CHAT_UPLOADS_FOLDER,
  GLOBAL_STORAGE_QUOTA,
  MAX_CAPTION_LENGTH,
  MAX_MESSAGE_LENGTH,
  MESSAGES_PAGE_SIZE,
  TEXT_RATE_LIMIT,
  UPLOAD_RATE_LIMIT,
  USER_STORAGE_QUOTA,
} from './chat.constants.js';

export interface PublicMessage {
  id: number;
  conversationId: number;
  isMine: boolean;
  type: MessageType;
  content: string;
  createdAt: Date;
  readAt: Date | null;
  deleted: boolean;
  attachment: {
    name: string;
    mime: string;
    size: number;
    duration: number | null;
    url: string;
  } | null;
}

export interface UploadedChatFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

function chatError(status: HttpStatus, code: string, message: string): HttpException {
  return new HttpException({ statusCode: status, code, message }, status);
}

function safeAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return /^https?:\/\//i.test(url) || url.startsWith('/') ? url : null;
}

function fullNameOf(firstName?: string | null, lastName?: string | null): string {
  return [firstName, lastName].filter(Boolean).join(' ').trim();
}

@Injectable()
export class ChatService implements OnModuleInit {
  private readonly textLimiter = new RateLimiter(TEXT_RATE_LIMIT.max, TEXT_RATE_LIMIT.windowMs);
  private readonly uploadLimiter = new RateLimiter(UPLOAD_RATE_LIMIT.max, UPLOAD_RATE_LIMIT.windowMs);
  private readonly uploadsFolder = resolve(process.cwd(), CHAT_UPLOADS_FOLDER);

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,

    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,

    @InjectRepository(InterestRequest)
    private readonly interestRequestRepository: Repository<InterestRequest>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,

    private readonly presence: PresenceService,
  ) {}

  async onModuleInit() {
    await mkdir(this.uploadsFolder, { recursive: true });
  }

  async findOrCreateConversation(userA: number, userB: number): Promise<Conversation> {
    this.validateId(userA, 'userId');
    this.validateId(userB, 'userId');

    if (userA === userB) {
      throw new BadRequestException('A conversation requires two different users');
    }

    const existing = await this.conversationRepository.findOne({
      where: [
        { participantOneId: userA, participantTwoId: userB },
        { participantOneId: userB, participantTwoId: userA },
      ],
      order: { id: 'ASC' },
    });
    if (existing) return existing;

    const otherUserExists = await this.userRepository.exists({ where: { id: userB } });
    if (!otherUserExists) throw new NotFoundException('User not found');

    return this.conversationRepository.save(
      this.conversationRepository.create({ participantOneId: userA, participantTwoId: userB }),
    );
  }

  async getConversations(userId: number, search?: string) {
    this.validateId(userId, 'userId');

    const params: unknown[] = [userId];
    let searchSql = '';
    const term = search?.trim();

    if (term) {
      params.push(`%${term.replace(/[\\%_]/g, '\\$&')}%`);
      searchSql = `AND (COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", '')) ILIKE $2 ESCAPE '\\'`;
    }

    const rows: Array<{
      id: number;
      updated_at: Date;
      peer_id: number;
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
    }> = await this.conversationRepository.query(
      `SELECT c.id, c.updated_at,
              CASE WHEN c.participant_one_id = $1 THEN c.participant_two_id ELSE c.participant_one_id END AS peer_id,
              u."firstName" AS first_name, u."lastName" AS last_name, u."avatarUrl" AS avatar_url
         FROM conversations c
         LEFT JOIN "user" u
           ON u.id = CASE WHEN c.participant_one_id = $1 THEN c.participant_two_id ELSE c.participant_one_id END
        WHERE (c.participant_one_id = $1 OR c.participant_two_id = $1) ${searchSql}
        ORDER BY c.updated_at DESC
        LIMIT 200`,
      params,
    );

    if (rows.length === 0) return [];

    const ids = rows.map((row) => Number(row.id));

    const lastIdRows: Array<{ id: number }> = await this.messageRepository.query(
      `SELECT DISTINCT ON (conversation_id) id
         FROM messages
        WHERE conversation_id = ANY($1)
        ORDER BY conversation_id, id DESC`,
      [ids],
    );
    const lastMessages = lastIdRows.length
      ? await this.messageRepository.findBy({ id: In(lastIdRows.map((r) => Number(r.id))) })
      : [];

    const unreadRows: Array<{ conversation_id: number; count: number }> =
      await this.messageRepository.query(
        `SELECT conversation_id, COUNT(*)::int AS count
           FROM messages
          WHERE conversation_id = ANY($1) AND sender_id <> $2
            AND read_at IS NULL AND deleted_at IS NULL
          GROUP BY conversation_id`,
        [ids, userId],
      );

    const lastById = new Map(lastMessages.map((m) => [m.conversationId, m]));
    const unreadById = new Map(unreadRows.map((r) => [Number(r.conversation_id), Number(r.count)]));

    return rows.map((row) => {
      const id = Number(row.id);
      const peerId = Number(row.peer_id);
      const last = lastById.get(id);

      return {
        id,
        updatedAt: row.updated_at,
        peer: {
          name: fullNameOf(row.first_name, row.last_name) || null,
          avatarUrl: safeAvatarUrl(row.avatar_url),
          online: this.presence.isOnline(peerId),
          lastSeen: this.presence.getLastSeen(peerId),
        },
        lastMessage: last ? this.toPublicMessage(last, userId) : null,
        unreadCount: unreadById.get(id) ?? 0,
      };
    });
  }

  async getPeerProfile(conversationId: number, userId: number) {
    const conversation = await this.findConversationForUser(conversationId, userId);
    const peerId = this.getPeerId(conversation, userId);

    const user = await this.userRepository.findOne({ where: { id: peerId } });
    if (!user) throw new NotFoundException('User not found');

    const [rating]: Array<{ count: number; average: number | null }> =
      await this.userRepository.query(
        `SELECT COUNT(*)::int AS count, AVG(rating)::float AS average FROM reviews WHERE reviewed_id = $1`,
        [peerId],
      );

    return {
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: fullNameOf(user.firstName, user.lastName),
      avatarUrl: safeAvatarUrl(user.avatarUrl),
      bio: user.bio ?? null,
      linkedin: user.linkedin ?? null,
      instagram: user.instagram ?? null,
      facebook: user.facebook ?? null,
      online: this.presence.isOnline(peerId),
      lastSeen: this.presence.getLastSeen(peerId),
      rating: {
        count: Number(rating?.count ?? 0),
        average: rating?.average != null ? Math.round(Number(rating.average) * 10) / 10 : null,
      },
      conversationSince: conversation.createdAt,
    };
  }

  async getContacts(userId: number): Promise<Array<{ conversationId: number; peerId: number }>> {
    const rows: Array<{ id: number; peer_id: number }> = await this.conversationRepository.query(
      `SELECT id, CASE WHEN participant_one_id = $1 THEN participant_two_id ELSE participant_one_id END AS peer_id
         FROM conversations
        WHERE participant_one_id = $1 OR participant_two_id = $1`,
      [userId],
    );
    return rows.map((row) => ({ conversationId: Number(row.id), peerId: Number(row.peer_id) }));
  }

  async getMessages(conversationId: number, userId: number, before?: number, limit = MESSAGES_PAGE_SIZE) {
    this.validateId(conversationId, 'conversationId');
    this.validateId(userId, 'userId');
    await this.findConversationForUser(conversationId, userId);

    const page = await this.messageRepository.find({
      where: before ? { conversationId, id: LessThan(before) } : { conversationId },
      order: { id: 'DESC' },
      take: limit + 1,
    });

    const hasMore = page.length > limit;
    const messages = page.slice(0, limit).reverse().map((m) => this.toPublicMessage(m, userId));
    return { messages, hasMore };
  }

  async sendText(conversationId: number, senderId: number, content: string) {
    this.validateId(conversationId, 'conversationId');
    this.validateId(senderId, 'senderId');

    const text = typeof content === 'string' ? content.trim() : '';
    if (!text) throw new BadRequestException('Message content cannot be empty');
    if (text.length > MAX_MESSAGE_LENGTH) {
      throw chatError(HttpStatus.PAYLOAD_TOO_LARGE, 'MESSAGE_TOO_LONG', 'Message too long');
    }

    const conversation = await this.findConversationForUser(conversationId, senderId);

    if (!this.textLimiter.tryConsume(senderId)) {
      throw chatError(HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMIT', 'You are sending messages too fast');
    }

    const message = await this.messageRepository.save(
      this.messageRepository.create({ conversationId, senderId, content: text, type: 'text' }),
    );
    await this.touchConversation(conversationId);

    return { conversation, message };
  }

  async sendAttachment(
    conversationId: number,
    senderId: number,
    file: UploadedChatFile | undefined,
    caption?: string,
    duration?: number,
  ) {
    this.validateId(conversationId, 'conversationId');
    this.validateId(senderId, 'senderId');

    if (!file || !file.buffer?.length) throw new BadRequestException('A file is required');

    const conversation = await this.findConversationForUser(conversationId, senderId);

    const mime = normalizeMimeType(file.mimetype);
    const allowed = ALLOWED_TYPES[mime];
    if (!allowed) {
      throw chatError(HttpStatus.UNSUPPORTED_MEDIA_TYPE, 'FILE_TYPE', 'This file type is not allowed');
    }
    if (!allowed.matches(file.buffer)) {
      throw chatError(HttpStatus.UNSUPPORTED_MEDIA_TYPE, 'FILE_TYPE', 'The file content does not match its type');
    }

    const size = file.buffer.length;
    if (size > MAX_SIZE_BY_KIND[allowed.kind]) {
      throw chatError(HttpStatus.PAYLOAD_TOO_LARGE, 'FILE_TOO_LARGE', 'This file is too large');
    }

    const text = (caption ?? '').trim();
    if (text.length > MAX_CAPTION_LENGTH) {
      throw chatError(HttpStatus.PAYLOAD_TOO_LARGE, 'MESSAGE_TOO_LONG', 'Caption too long');
    }

    if (!this.uploadLimiter.tryConsume(senderId)) {
      throw chatError(HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMIT', 'You are sending files too fast');
    }

    await this.assertStorageQuota(senderId, size);

    const storedName = `${randomUUID()}${allowed.extension}`;
    const diskPath = join(this.uploadsFolder, storedName);
    await writeFile(diskPath, file.buffer, { flag: 'wx' });

    try {
      const message = await this.messageRepository.save(
        this.messageRepository.create({
          conversationId,
          senderId,
          content: text,
          type: allowed.kind,
          attachmentPath: storedName,
          attachmentName: sanitizeFileName(file.originalname, allowed.extension),
          attachmentMime: mime,
          attachmentSize: size,
          audioDuration: allowed.kind === 'audio' && duration != null ? Math.round(duration) : null,
        }),
      );
      await this.touchConversation(conversationId);
      return { conversation, message };
    } catch (error) {
      await unlink(diskPath).catch(() => undefined);
      throw error;
    }
  }

  async getAttachment(messageId: number, userId: number) {
    this.validateId(messageId, 'messageId');

    const message = await this.messageRepository
      .createQueryBuilder('m')
      .addSelect('m.attachmentPath')
      .where('m.id = :messageId', { messageId })
      .getOne();

    if (!message || !message.attachmentPath || message.deletedAt) {
      throw new NotFoundException('Attachment not found');
    }

    await this.findConversationForUser(message.conversationId, userId);

    return {
      path: join(this.uploadsFolder, basename(message.attachmentPath)),
      mime: message.attachmentMime ?? 'application/octet-stream',
      name: message.attachmentName ?? 'file',
      size: message.attachmentSize ?? undefined,
    };
  }

  async deleteMessage(messageId: number, userId: number) {
    this.validateId(messageId, 'messageId');

    const message = await this.messageRepository
      .createQueryBuilder('m')
      .addSelect('m.attachmentPath')
      .where('m.id = :messageId', { messageId })
      .getOne();

    if (!message) throw new NotFoundException('Message not found');

    const conversation = await this.findConversationForUser(message.conversationId, userId);

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    const oldPath = message.attachmentPath;

    if (!message.deletedAt) {
      await this.messageRepository.update(message.id, {
        deletedAt: new Date(),
        content: '',
        attachmentPath: null,
        attachmentName: null,
        attachmentMime: null,
        attachmentSize: null,
        audioDuration: null,
      });
      if (oldPath) {
        await unlink(join(this.uploadsFolder, basename(oldPath))).catch(() => undefined);
      }
    }

    const updated = await this.messageRepository.findOneByOrFail({ id: message.id });
    return { conversation, message: updated };
  }

  async markAsRead(conversationId: number, userId: number) {
    const conversation = await this.findConversationForUser(conversationId, userId);

    const result = await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ readAt: () => 'now()' })
      .where('conversation_id = :conversationId', { conversationId })
      .andWhere('sender_id <> :userId', { userId })
      .andWhere('read_at IS NULL')
      .execute();

    return { conversation, updated: result.affected ?? 0 };
  }

  async getUnreadTotal(userId: number): Promise<number> {
    this.validateId(userId, 'userId');
    const [row]: Array<{ count: number }> = await this.messageRepository.query(
      `SELECT COUNT(*)::int AS count
         FROM messages m
         JOIN conversations c ON c.id = m.conversation_id
        WHERE (c.participant_one_id = $1 OR c.participant_two_id = $1)
          AND m.sender_id <> $1 AND m.read_at IS NULL AND m.deleted_at IS NULL`,
      [userId],
    );
    return Number(row?.count ?? 0);
  }

  async verifyConversationAccess(conversationId: number, userId: number): Promise<Conversation> {
    return this.findConversationForUser(conversationId, userId);
  }

  getPeerId(conversation: Conversation, userId: number): number {
    return conversation.participantOneId === userId
      ? conversation.participantTwoId
      : conversation.participantOneId;
  }

  async getUserName(userId: number): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true },
    });
    return fullNameOf(user?.firstName, user?.lastName);
  }

  toPublicMessage(message: Message, viewerId: number): PublicMessage {
    const deleted = message.deletedAt != null;
    const hasAttachment = !deleted && message.type !== 'text' && message.attachmentMime != null;

    return {
      id: Number(message.id),
      conversationId: Number(message.conversationId),
      isMine: Number(message.senderId) === viewerId,
      type: message.type ?? 'text',
      content: deleted ? '' : message.content,
      createdAt: message.createdAt,
      readAt: message.readAt ?? null,
      deleted,
      attachment: hasAttachment
        ? {
            name: message.attachmentName ?? 'file',
            mime: message.attachmentMime!,
            size: Number(message.attachmentSize ?? 0),
            duration: message.audioDuration ?? null,
            url: `/chat/messages/${message.id}/attachment`,
          }
        : null,
    };
  }

  private async assertStorageQuota(senderId: number, newSize: number) {
    const [row]: Array<{ mine: string | null; total: string | null }> =
      await this.messageRepository.query(
        `SELECT COALESCE(SUM(attachment_size) FILTER (WHERE sender_id = $1), 0) AS mine,
                COALESCE(SUM(attachment_size), 0) AS total
           FROM messages
          WHERE attachment_size IS NOT NULL AND deleted_at IS NULL`,
        [senderId],
      );

    if (Number(row?.mine ?? 0) + newSize > USER_STORAGE_QUOTA) {
      throw chatError(HttpStatus.PAYLOAD_TOO_LARGE, 'QUOTA', 'You have used all your storage space');
    }
    if (Number(row?.total ?? 0) + newSize > GLOBAL_STORAGE_QUOTA) {
      throw chatError(HttpStatus.INSUFFICIENT_STORAGE, 'QUOTA', 'The server storage is full');
    }
  }

  private async touchConversation(conversationId: number) {
    await this.conversationRepository.update(conversationId, { updatedAt: new Date() });
  }

  private async findConversationForUser(conversationId: number, userId: number): Promise<Conversation> {
    this.validateId(conversationId, 'conversationId');
    this.validateId(userId, 'userId');

    const conversation = await this.conversationRepository.findOne({
      where: [
        { id: conversationId, participantOneId: userId },
        { id: conversationId, participantTwoId: userId },
      ],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found for this user');
    }
    return conversation;
  }

  private validateId(value: number, field: string): void {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} must be a positive integer`);
    }
  }

  async sendInterestRequest(tenantId: number, listingId: number) {
    this.validateId(tenantId, 'tenantId');
    this.validateId(listingId, 'listingId');

    const listing = await this.listingRepository.findOne({
      where: { id: listingId },
      select: { id: true, ownerId: true },
    });
    if (!listing || !listing.ownerId) throw new NotFoundException('Listing not found');

    const ownerId = listing.ownerId;
    if (tenantId === ownerId) {
      throw new BadRequestException('You cannot send an interest request to yourself');
    }

    const existing = await this.interestRequestRepository.findOne({
      where: { tenantId, listingId },
    });
    if (existing) return { request: existing, created: false };

    const request = await this.interestRequestRepository.save(
      this.interestRequestRepository.create({
        tenantId,
        ownerId,
        listingId,
        status: InterestRequestStatus.PENDING,
      }),
    );
    return { request, created: true };
  }

  async getInterestStatus(tenantId: number, listingId: number) {
    return this.interestRequestRepository.findOne({
      where: { tenantId, listingId },
    });
  }

  async getOwnerInterestRequests(ownerId: number) {
    this.validateId(ownerId, 'ownerId');

    const result = await this.interestRequestRepository
      .createQueryBuilder('req')
      .leftJoin(User, 'tenant', 'tenant.id = req.tenantId')
      .leftJoin(Listing, 'listing', 'listing.id = req.listingId')
      .select([
        'req.id',
        'req.tenantId',
        'req.ownerId',
        'req.listingId',
        'req.status',
        'req.conversationId',
        'req.createdAt',
        'tenant.firstName',
        'tenant.lastName',
        'listing.titleEn',
        'listing.titleFr',
        'listing.titleAr',
      ])
      .where('req.ownerId = :ownerId', { ownerId })
      .orderBy('req.createdAt', 'DESC')
      .getRawAndEntities();

    return result.entities.map((req, index) => {
      const raw = result.raw[index];

      const tenantName =
        raw.tenant_firstName && raw.tenant_lastName
          ? `${raw.tenant_firstName} ${raw.tenant_lastName}`
          : raw.tenant_firstName ?? `Applicant #${req.tenantId}`;

      const listingTitle =
        raw.listing_titleEn ||
        raw.listing_titleFr ||
        raw.listing_titleAr ||
        `Listing #${req.listingId}`;

      return {
        ...req,
        tenantName,
        listingTitle,
        listingTitleEn: raw.listing_titleEn,
        listingTitleFr: raw.listing_titleFr,
        listingTitleAr: raw.listing_titleAr,
      };
    });
  }

  async acceptInterestRequest(ownerId: number, requestId: number) {
    this.validateId(ownerId, 'ownerId');
    this.validateId(requestId, 'requestId');

    const request = await this.interestRequestRepository.findOne({
      where: { id: requestId, ownerId },
    });

    if (!request) {
      throw new NotFoundException('Interest request not found');
    }

    const conversation = await this.findOrCreateConversation(ownerId, request.tenantId);

    request.status = InterestRequestStatus.ACCEPTED;
    request.conversationId = conversation.id;
    await this.interestRequestRepository.save(request);

    return { request, conversation };
  }
}
