import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request, Response } from 'express';
import { ChatService } from './chat.service.js';
import type { UploadedChatFile } from './chat.service.js';
import { ChatGateway } from './chat.gateway.js';
import type { InterestEvent } from './chat.gateway.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { MAX_UPLOAD_SIZE } from './chat.constants.js';
import {
  ConversationsQueryDto,
  MessagesQueryDto,
  SendAttachmentDto,
  SendMessageDto,
} from './dto/chat.dto.js';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
  };
}

function contentDisposition(type: 'inline' | 'attachment', fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get('conversations')
  getConversations(@Req() request: AuthenticatedRequest, @Query() query: ConversationsQueryDto) {
    return this.chatService.getConversations(request.user.userId, query.search);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() request: AuthenticatedRequest) {
    return { count: await this.chatService.getUnreadTotal(request.user.userId) };
  }

  @Get('conversations/:id/peer')
  getPeer(@Param('id', ParseIntPipe) conversationId: number, @Req() request: AuthenticatedRequest) {
    return this.chatService.getPeerProfile(conversationId, request.user.userId);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Param('id', ParseIntPipe) conversationId: number,
    @Query() query: MessagesQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.chatService.getMessages(conversationId, request.user.userId, query.before, query.limit);
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Param('id', ParseIntPipe) conversationId: number,
    @Body() body: SendMessageDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const userId = request.user.userId;
    const { conversation, message } = await this.chatService.sendText(conversationId, userId, body.content);

    this.chatGateway.emitNewMessage(conversation, message, await this.chatService.getUserName(userId));
    return this.chatService.toPublicMessage(message, userId);
  }

  @Post('conversations/:id/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_SIZE, files: 1, fields: 5, fieldSize: 8 * 1024, parts: 8 },
    }),
  )
  async sendAttachment(
    @Param('id', ParseIntPipe) conversationId: number,
    @UploadedFile() file: UploadedChatFile | undefined,
    @Body() body: SendAttachmentDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const userId = request.user.userId;
    const { conversation, message } = await this.chatService.sendAttachment(
      conversationId,
      userId,
      file,
      body.caption,
      body.duration,
    );

    this.chatGateway.emitNewMessage(conversation, message, await this.chatService.getUserName(userId));
    return this.chatService.toPublicMessage(message, userId);
  }

  @Post('conversations/:id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id', ParseIntPipe) conversationId: number, @Req() request: AuthenticatedRequest) {
    const userId = request.user.userId;
    const { conversation, updated } = await this.chatService.markAsRead(conversationId, userId);

    if (updated > 0) this.chatGateway.emitMessagesRead(conversation, userId);
    return { updated };
  }

  @Get('messages/:id/attachment')
  async getAttachment(
    @Param('id', ParseIntPipe) messageId: number,
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
  ) {
    const file = await this.chatService.getAttachment(messageId, request.user.userId);
    const inline = file.mime.startsWith('image/') || file.mime.startsWith('audio/');

    response.setHeader('Content-Type', file.mime);
    response.setHeader('Content-Disposition', contentDisposition(inline ? 'inline' : 'attachment', file.name));
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; media-src 'self'; sandbox");
    response.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    response.setHeader('Cache-Control', 'private, max-age=86400');

    response.sendFile(file.path, { dotfiles: 'deny' }, (error) => {
      if (error && !response.headersSent) {
        response.removeHeader('Content-Disposition');
        response.status(404).json(new NotFoundException('Attachment not found').getResponse());
      }
    });
  }

  @Delete('messages/:id')
  async deleteMessage(@Param('id', ParseIntPipe) messageId: number, @Req() request: AuthenticatedRequest) {
    const userId = request.user.userId;
    const { conversation, message } = await this.chatService.deleteMessage(messageId, userId);

    this.chatGateway.emitMessageDeleted(conversation, message);
    return this.chatService.toPublicMessage(message, userId);
  }

  private async broadcastInterest(ownerId: number, tenantId: number, requestId: number, event: InterestEvent) {
    const [ownerView, tenantView] = await Promise.all([
      this.chatService.getOwnerInterestRequest(ownerId, requestId),
      this.chatService.getSentInterestRequest(tenantId, requestId),
    ]);
    if (ownerView) this.chatGateway.emitIncomingInterest(ownerId, ownerView, event);
    if (tenantView) this.chatGateway.emitSentInterest(tenantId, tenantView, event);
    return { ownerView, tenantView };
  }

  @Post('interest-requests')
  async sendInterestRequest(
    @Req() request: AuthenticatedRequest,
    @Body('listingId', ParseIntPipe) listingId: number,
  ) {
    const tenantId = request.user.userId;
    const { request: saved, created } = await this.chatService.sendInterestRequest(tenantId, listingId);

    if (created) {
      const { tenantView } = await this.broadcastInterest(saved.ownerId, tenantId, saved.id, 'created');
      return tenantView;
    }
    return this.chatService.getSentInterestRequest(tenantId, saved.id);
  }

  @Get('interest-requests/status/:listingId')
  getInterestStatus(
    @Req() request: AuthenticatedRequest,
    @Param('listingId', ParseIntPipe) listingId: number,
  ) {
    return this.chatService.getInterestStatus(request.user.userId, listingId);
  }

  @Get('interest-requests/owner')
  getOwnerRequests(@Req() request: AuthenticatedRequest) {
    return this.chatService.getOwnerInterestRequests(request.user.userId);
  }

  @Get('interest-requests/sent')
  getSentRequests(@Req() request: AuthenticatedRequest) {
    return this.chatService.getSentInterestRequests(request.user.userId);
  }

  @Patch('interest-requests/:id/accept')
  async acceptRequest(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) requestId: number,
  ) {
    const ownerId = request.user.userId;
    const { request: saved, conversation } = await this.chatService.acceptInterestRequest(ownerId, requestId);
    const { ownerView } = await this.broadcastInterest(ownerId, saved.tenantId, saved.id, 'accepted');
    return { request: ownerView, conversationId: conversation.id };
  }

  @Patch('interest-requests/:id/decline')
  async declineRequest(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) requestId: number,
  ) {
    const ownerId = request.user.userId;
    const { request: saved } = await this.chatService.declineInterestRequest(ownerId, requestId);
    const { ownerView } = await this.broadcastInterest(ownerId, saved.tenantId, saved.id, 'declined');
    return { request: ownerView };
  }
}
