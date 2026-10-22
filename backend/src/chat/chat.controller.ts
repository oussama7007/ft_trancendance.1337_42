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
} from '@nestjs/common';
import type { Request } from 'express';
import { ChatService } from './chat.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
  };
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

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
  getConversations(@Req() request: AuthenticatedRequest) {
    return this.chatService.getConversations(request.user.userId);
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
  sendInterestRequest(
    @Req() request: AuthenticatedRequest,
    @Body('listingId', ParseIntPipe) listingId: number,
    @Body('ownerId', ParseIntPipe) ownerId: number,
  ) {
    return this.chatService.sendInterestRequest(
      request.user.userId,
      listingId,
      ownerId,
    );
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
  acceptRequest(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) requestId: number,
  ) {
    return this.chatService.acceptInterestRequest(
      request.user.userId,
      requestId,
    );
  }
}
