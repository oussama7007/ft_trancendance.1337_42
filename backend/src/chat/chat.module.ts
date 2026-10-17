import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity.js';
import { Message } from './entities/message.entity.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { SharedJwtModule } from '../auth/jwt.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message]),
    SharedJwtModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
