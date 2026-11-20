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
  sub: number;
  iat?: number;
  exp?: number;
}

interface SendMessagePayload {
  id: number;
  conversationId: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
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

      const sockets = this.connectedUsers.get(userId) ?? new Set<string>();
      const wasOffline = sockets.size === 0;

      sockets.add(client.id);
      this.connectedUsers.set(userId, sockets);

      client.emit('onlineUsers', Array.from(this.connectedUsers.keys()));

      if (wasOffline) {
        this.server.emit('userOnline', { userId });
      }

      console.log(`User ${userId} connected: ${client.id}`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as number | undefined;

    if (!userId) return;

    const sockets = this.connectedUsers.get(userId);

    if (!sockets) return;

    sockets.delete(client.id);

    if (sockets.size === 0) {
      this.connectedUsers.delete(userId);
      this.server.emit('userOffline', { userId });
    }

    console.log(`User ${userId} disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @MessageBody() data: { conversationId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId as number | undefined;

    if (!userId || !Number.isSafeInteger(data.conversationId)) {
      return;
    }

    try {
      await this.chatService.verifyConversationAccess(
        data.conversationId,
        userId,
      );

      await client.join(`conversation_${data.conversationId}`);
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
    const senderId = client.data.userId as number | undefined;

    if (
      !senderId ||
      !Number.isSafeInteger(data.id) ||
      !Number.isSafeInteger(data.conversationId)
    ) {
      return;
    }

    try {
      const message = await this.chatService.getMessageForBroadcast(
        data.id,
        data.conversationId,
        senderId,
      );

      client
        .to(`conversation_${message.conversationId}`)
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
