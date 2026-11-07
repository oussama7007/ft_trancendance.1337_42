import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Conversation } from './entities/conversation.entity.js';
import { Message } from './entities/message.entity.js';
import { InterestRequest, InterestRequestStatus } from './entities/interest-request.entity.js';
import { User } from '../auth/user.entity.js';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,

    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,

    @InjectRepository(InterestRequest)
    private readonly interestRequestRepository: Repository<InterestRequest>,
  ) { }

  async createConversation(
    participantOneId: number,
    participantTwoId: number,
  ): Promise<Conversation> {
    this.validateId(participantOneId, 'participantOneId');
    this.validateId(participantTwoId, 'participantTwoId');

    if (participantOneId === participantTwoId) {
      throw new BadRequestException(
        'A conversation requires two different users',
      );
    }

    const conversation = this.conversationRepository.create({
      participantOneId,
      participantTwoId,
    });

    return this.conversationRepository.save(conversation);
  }

  async getConversations(userId: number, search?: string) {
    this.validateId(userId, 'userId');

    const queryBuilder = this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoin(User, 'p1', 'p1.id = conversation.participantOneId')
      .leftJoin(User, 'p2', 'p2.id = conversation.participantTwoId')
      .select([
        'conversation.id',
        'conversation.participantOneId',
        'conversation.participantTwoId',
        'conversation.createdAt',
        'conversation.updatedAt',
        'p1.id',
        'p1.firstName',
        'p1.lastName',
        'p2.id',
        'p2.firstName',
        'p2.lastName',
      ])
      .where(
        new Brackets((qb) => {
          qb.where('conversation.participantOneId = :userId', { userId })
            .orWhere('conversation.participantTwoId = :userId', { userId });
        }),
      );

    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(p1.firstName) LIKE :search OR LOWER(p1.lastName) LIKE :search', { search: searchTerm })
            .orWhere('LOWER(p2.firstName) LIKE :search OR LOWER(p2.lastName) LIKE :search', { search: searchTerm });
        }),
      );
    }

    const result = await queryBuilder
      .orderBy('conversation.updatedAt', 'DESC')
      .getRawAndEntities();

    return result.entities.map((conv, index) => {
      const raw = result.raw[index];

      const p1FullName = raw.p1_firstName && raw.p1_lastName
        ? `${raw.p1_firstName} ${raw.p1_lastName}`
        : `User ${conv.participantOneId}`;

      const p2FullName = raw.p2_firstName && raw.p2_lastName
        ? `${raw.p2_firstName} ${raw.p2_lastName}`
        : `User ${conv.participantTwoId}`;

      return {
        ...conv,
        participantOneName: p1FullName,
        participantTwoName: p2FullName,
      };
    });
  }

  async getMessages(
    conversationId: number,
    userId: number,
  ): Promise<Message[]> {
    this.validateId(conversationId, 'conversationId');
    this.validateId(userId, 'userId');

    await this.findConversationForUser(conversationId, userId);

    return this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
  }

  async sendMessage(
    conversationId: number,
    senderId: number,
    content: string,
  ): Promise<Message> {
    this.validateId(conversationId, 'conversationId');
    this.validateId(senderId, 'senderId');

    if (typeof content !== 'string' || !content.trim()) {
      throw new BadRequestException('Message content cannot be empty');
    }

    await this.findConversationForUser(conversationId, senderId);

    const message = this.messageRepository.create({
      conversationId,
      senderId,
      content: content.trim(),
    });

    const savedMessage = await this.messageRepository.save(message);

    await this.conversationRepository.update(conversationId, {
      updatedAt: new Date(),
    });

    return savedMessage;
  }

  private async findConversationForUser(
    conversationId: number,
    userId: number,
  ): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: [
        { id: conversationId, participantOneId: userId },
        { id: conversationId, participantTwoId: userId },
      ],
    });

    if (!conversation) {
      throw new NotFoundException(
        'Conversation not found for this user',
      );
    }

    return conversation;
  }

  private validateId(value: number, field: string): void {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} must be a positive integer`);
    }
  }

  async sendInterestRequest(tenantId: number, listingId: number, ownerId: number) {
    if (tenantId === ownerId) {
      throw new BadRequestException('You cannot send an interest request to yourself');
    }

    const existing = await this.interestRequestRepository.findOne({
      where: { tenantId, listingId },
    });

    if (existing) {
      return existing;
    }

    const request = this.interestRequestRepository.create({
      tenantId,
      ownerId,
      listingId,
      status: InterestRequestStatus.PENDING,
    });

    return this.interestRequestRepository.save(request);
  }

  async getInterestStatus(tenantId: number, listingId: number) {
    return this.interestRequestRepository.findOne({
      where: { tenantId, listingId },
    });
  }

  async getOwnerInterestRequests(ownerId: number) {
    return this.interestRequestRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  async acceptInterestRequest(ownerId: number, requestId: number) {
    const request = await this.interestRequestRepository.findOne({
      where: { id: requestId, ownerId },
    });

    if (!request) {
      throw new NotFoundException('Interest request not found');
    }

    let conversation = await this.conversationRepository.findOne({
      where: [
        { participantOneId: request.tenantId, participantTwoId: ownerId },
        { participantOneId: ownerId, participantTwoId: request.tenantId },
      ],
    });

    if (!conversation) {
      conversation = await this.createConversation(request.tenantId, ownerId);
    }

    request.status = InterestRequestStatus.ACCEPTED;
    request.conversationId = conversation.id;
    await this.interestRequestRepository.save(request);

    return { request, conversation };
  }

}
