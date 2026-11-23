import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
  Patch,
  Query,
} from '@nestjs/common';
import type { Request } from 'express';
import { ChatService } from './chat.service.js';
import { ChatGateway } from './chat.gateway.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
  };
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post('conversations')
  createConversation(
    @Req() request: AuthenticatedRequest,
    @Body('participantTwoId', ParseIntPipe) participantTwoId: number,
  ) {
    const currentUserId = request.user.userId;

    return this.chatService.createConversation(
      currentUserId,
      participantTwoId,
    );
  }

  @Get('conversations')
  getConversations(
    @Req() request: AuthenticatedRequest,
    @Query('search') search?: string,
  ) {
    return this.chatService.getConversations(request.user.userId, search);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Param('id', ParseIntPipe) conversationId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.chatService.getMessages(
      conversationId,
      request.user.userId,
    );
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Param('id', ParseIntPipe) conversationId: number,
    @Body('content') content: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.chatService.sendMessage(
      conversationId,
      request.user.userId,
      content,
    );
  }

  @Post('interest-requests')
  async sendInterestRequest(
    @Req() request: AuthenticatedRequest,
    @Body('listingId', ParseIntPipe) listingId: number,
    @Body('ownerId', ParseIntPipe) ownerId: number,
  ) {
    const created = await this.chatService.sendInterestRequest(
      request.user.userId,
      listingId,
      ownerId,
    );

    const ownerRequests =
      await this.chatService.getOwnerInterestRequests(ownerId);
    const enriched =
      ownerRequests.find((item) => item.id === created.id) ?? created;

    this.chatGateway.notifyInterestRequestCreated(ownerId, {
      id: enriched.id,
      tenantId: enriched.tenantId,
      tenantName: (enriched as { tenantName?: string }).tenantName,
      ownerId: enriched.ownerId,
      listingId: enriched.listingId,
      listingTitle: (enriched as { listingTitle?: string }).listingTitle,
      status: enriched.status,
      createdAt: enriched.createdAt,
    });

    return created;
  }

  @Get('interest-requests/status/:listingId')
  getInterestStatus(
    @Req() request: AuthenticatedRequest,
    @Param('listingId', ParseIntPipe) listingId: number,
  ) {
    return this.chatService.getInterestStatus(
      request.user.userId,
      listingId,
    );
  }

  @Get('interest-requests/owner')
  getOwnerRequests(@Req() request: AuthenticatedRequest) {
    return this.chatService.getOwnerInterestRequests(request.user.userId);
  }

  @Patch('interest-requests/:id/accept')
  async acceptRequest(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) requestId: number,
  ) {
    const result = await this.chatService.acceptInterestRequest(
      request.user.userId,
      requestId,
    );

    this.chatGateway.notifyInterestRequestAccepted(result.request.tenantId, {
      requestId: result.request.id,
      listingId: result.request.listingId,
      ownerId: result.request.ownerId,
      tenantId: result.request.tenantId,
      conversationId: result.conversation.id,
      status: result.request.status,
    });

    return result;
  }
}
