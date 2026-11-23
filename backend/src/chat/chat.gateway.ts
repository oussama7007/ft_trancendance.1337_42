import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service.js';
import { PresenceService } from './presence.service.js';
import { RateLimiter } from './rate-limiter.js';
import { TYPING_RATE_LIMIT } from './chat.constants.js';
import type { Conversation } from './entities/conversation.entity.js';
import type { Message } from './entities/message.entity.js';
import { isAllowedOrigin } from '../allowed-origins.js';

interface JwtPayload {
  sub: number | string;
  iat?: number;
  exp?: number;
}

export interface InterestAcceptedPayload {
  requestId: number;
  listingId: number;
  ownerId: number;
  tenantId: number;
  conversationId: number;
  status: string;
}

export interface InterestRequestCreatedPayload {
  id: number;
  tenantId: number;
  tenantName?: string;
  ownerId: number;
  listingId: number;
  listingTitle?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string | Date;
}

const userRoom = (userId: number) => `user_${userId}`;

@WebSocketGateway({
  cors: {
    origin: (origin: string | undefined, done: (error: Error | null, allow?: boolean) => void) =>
      done(null, isAllowedOrigin(origin)),
    credentials: true,
  },
  maxHttpBufferSize: 16 * 1024,
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly typingLimiter = new RateLimiter(TYPING_RATE_LIMIT.max, TYPING_RATE_LIMIT.windowMs);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly presence: PresenceService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      if (!isAllowedOrigin(client.handshake.headers.origin)) {
        client.disconnect(true);
        return;
      }

      const token = this.getCookie(client.handshake.headers.cookie, 'access_token');
      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const userId = Number(payload.sub);

      if (!Number.isSafeInteger(userId) || userId <= 0) {
        client.disconnect(true);
        return;
      }

      client.data.userId = userId;
      await client.join(userRoom(userId));

      if (this.presence.add(userId, client.id)) {
        await this.broadcastPresence(userId, true);
      }
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = Number(client.data.userId);
    if (!Number.isSafeInteger(userId) || userId <= 0) return;

    if (this.presence.remove(userId, client.id)) {
      await this.broadcastPresence(userId, false).catch(() => undefined);
    }
  }

  private async broadcastPresence(userId: number, online: boolean) {
    const contacts = await this.chatService.getContacts(userId);
    const lastSeen = online ? null : this.presence.getLastSeen(userId);

    for (const { conversationId, peerId } of contacts) {
      this.server.to(userRoom(peerId)).emit('presence', { conversationId, online, lastSeen });
    }
  }

  emitNewMessage(conversation: Conversation, message: Message, senderName: string) {
    for (const viewerId of [conversation.participantOneId, conversation.participantTwoId]) {
      this.server.to(userRoom(viewerId)).emit('newMessage', {
        ...this.chatService.toPublicMessage(message, viewerId),
        senderName,
      });
    }
  }

  emitMessageDeleted(conversation: Conversation, message: Message) {
    for (const viewerId of [conversation.participantOneId, conversation.participantTwoId]) {
      this.server
        .to(userRoom(viewerId))
        .emit('messageDeleted', this.chatService.toPublicMessage(message, viewerId));
    }
  }

  emitMessagesRead(conversation: Conversation, readerId: number) {
    const peerId = this.chatService.getPeerId(conversation, readerId);
    const readAt = new Date();
    this.server.to(userRoom(peerId)).emit('messagesRead', { conversationId: conversation.id, readAt });
    this.server.to(userRoom(readerId)).emit('conversationRead', { conversationId: conversation.id });
  }

  notifyInterestRequestCreated(ownerId: number, payload: InterestRequestCreatedPayload) {
    const normalizedOwnerId = Number(ownerId);
    if (!Number.isSafeInteger(normalizedOwnerId) || normalizedOwnerId <= 0) return;

    this.server.to(userRoom(normalizedOwnerId)).emit('newInterestRequest', {
      ...payload,
      id: Number(payload.id),
      tenantId: Number(payload.tenantId),
      ownerId: Number(payload.ownerId),
      listingId: Number(payload.listingId),
    });
  }

  notifyInterestRequestAccepted(tenantId: number, payload: InterestAcceptedPayload) {
    const normalizedTenantId = Number(tenantId);
    if (!Number.isSafeInteger(normalizedTenantId) || normalizedTenantId <= 0) return;

    this.server.to(userRoom(normalizedTenantId)).emit('interestRequestAccepted', {
      ...payload,
      requestId: Number(payload.requestId),
      listingId: Number(payload.listingId),
      ownerId: Number(payload.ownerId),
      tenantId: Number(payload.tenantId),
      conversationId: Number(payload.conversationId),
    });
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { conversationId?: unknown; isTyping?: unknown },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = Number(client.data.userId);
    const conversationId = Number(data?.conversationId);

    if (!Number.isSafeInteger(userId) || userId <= 0) return;
    if (!Number.isSafeInteger(conversationId) || conversationId <= 0) return;
    if (!this.typingLimiter.tryConsume(userId)) return;

    try {
      const conversation = await this.chatService.verifyConversationAccess(conversationId, userId);
      const peerId = this.chatService.getPeerId(conversation, userId);
      this.server.to(userRoom(peerId)).emit('typing', {
        conversationId,
        isTyping: data?.isTyping === true,
      });
    } catch {
    }
  }

  private getCookie(cookieHeader: string | undefined, name: string): string | undefined {
    if (!cookieHeader) return undefined;

    const cookie = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`));

    if (!cookie) return undefined;
    try {
      return decodeURIComponent(cookie.substring(name.length + 1));
    } catch {
      return undefined;
    }
  }
}
