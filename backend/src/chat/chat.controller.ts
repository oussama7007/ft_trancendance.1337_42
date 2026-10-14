import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  createConversation(
    @Body('participantOneId', ParseIntPipe) participantOneId: number,
    @Body('participantTwoId', ParseIntPipe) participantTwoId: number,
  ) {
    return this.chatService.createConversation(
      participantOneId,
      participantTwoId,
    );
  }

  @Get('conversations')
  getConversations(
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.chatService.getConversations(userId);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Param('id', ParseIntPipe) conversationId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.chatService.getMessages(conversationId, userId);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Param('id', ParseIntPipe) conversationId: number,
    @Body('senderId', ParseIntPipe) senderId: number,
    @Body('content') content: string,
  ) {
    return this.chatService.sendMessage(
      conversationId,
      senderId,
      content,
    );
  }
}
