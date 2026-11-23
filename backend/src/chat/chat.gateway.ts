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

interface JwtPayload {
  sub: number | string;
  iat?: number;
  exp?: number;
}

interface SendMessagePayload {
  id: number;
  conversationId: number;
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

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly connectedUsers = new Map<number, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.getCookie(
        client.handshake.headers.cookie,
        'access_token',
      );

      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload =
        await this.jwtService.verifyAsync<JwtPayload>(token);

      const userId = Number(payload.sub);

      if (!Number.isSafeInteger(userId) || userId <= 0) {
        client.disconnect(true);
        return;
      }

      client.data.userId = userId;
      await client.join(`user_${userId}`);

      const sockets = this.connectedUsers.get(userId) ?? new Set<string>();
      const wasOffline = sockets.size === 0;

      sockets.add(client.id);
      this.connectedUsers.set(userId, sockets);

      client.emit('onlineUsers', Array.from(this.connectedUsers.keys()));

      if (wasOffline) {
        this.server.emit('userOnline', { userId });
      }
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = Number(client.data.userId);

    if (!Number.isSafeInteger(userId) || userId <= 0) return;

    const sockets = this.connectedUsers.get(userId);

    if (!sockets) return;

    sockets.delete(client.id);

    if (sockets.size === 0) {
      this.connectedUsers.delete(userId);
      this.server.emit('userOffline', { userId });
    }
  }

  notifyInterestRequestCreated(
    ownerId: number,
    payload: InterestRequestCreatedPayload,
  ) {
    const normalizedOwnerId = Number(ownerId);
    if (!Number.isSafeInteger(normalizedOwnerId) || normalizedOwnerId <= 0) {
      return;
    }

    this.server.to(`user_${normalizedOwnerId}`).emit('newInterestRequest', {
      ...payload,
      id: Number(payload.id),
      tenantId: Number(payload.tenantId),
      ownerId: Number(payload.ownerId),
      listingId: Number(payload.listingId),
    });
  }

  notifyInterestRequestAccepted(
    tenantId: number,
    payload: InterestAcceptedPayload,
  ) {
    const normalizedTenantId = Number(tenantId);
    if (!Number.isSafeInteger(normalizedTenantId) || normalizedTenantId <= 0) {
      return;
    }

    this.server
      .to(`user_${normalizedTenantId}`)
      .emit('interestRequestAccepted', {
        ...payload,
        requestId: Number(payload.requestId),
        listingId: Number(payload.listingId),
        ownerId: Number(payload.ownerId),
        tenantId: Number(payload.tenantId),
        conversationId: Number(payload.conversationId),
      });
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @MessageBody() data: { conversationId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = Number(client.data.userId);
    const conversationId = Number(data?.conversationId);

    if (
      !Number.isSafeInteger(userId) ||
      userId <= 0 ||
      !Number.isSafeInteger(conversationId) ||
      conversationId <= 0
    ) {
      return;
    }

    try {
      await this.chatService.verifyConversationAccess(
        conversationId,
        userId,
      );

      await client.join(`conversation_${conversationId}`);
    } catch {
      client.emit('chatError', {
        message: 'You are not allowed to join this conversation',
      });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: SendMessagePayload,
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = Number(client.data.userId);
    const messageId = Number(data?.id);
    const conversationId = Number(data?.conversationId);

    if (
      !Number.isSafeInteger(senderId) ||
      senderId <= 0 ||
      !Number.isSafeInteger(messageId) ||
      messageId <= 0 ||
      !Number.isSafeInteger(conversationId) ||
      conversationId <= 0
    ) {
      return;
    }

    try {
      const message = await this.chatService.getMessageForBroadcast(
        messageId,
        conversationId,
        senderId,
      );

      const conversation = await this.chatService.verifyConversationAccess(
        conversationId,
        senderId,
      );

      const recipientId =
        conversation.participantOneId === senderId
          ? conversation.participantTwoId
          : conversation.participantOneId;

      client
        .to(`conversation_${message.conversationId}`)
        .emit('newMessage', message);

      this.server
        .to(`user_${recipientId}`)
        .emit('newMessage', message);
    } catch {
      client.emit('chatError', {
        message: 'Unable to broadcast this message',
      });
    }
  }

  private getCookie(
    cookieHeader: string | undefined,
    name: string,
  ): string | undefined {
    if (!cookieHeader) return undefined;

    const cookie = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`));

    return cookie
      ? decodeURIComponent(cookie.substring(name.length + 1))
      : undefined;
  }
}
