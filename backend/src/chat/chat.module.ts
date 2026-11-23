import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity.js';
import { Message } from './entities/message.entity.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { SharedJwtModule } from '../auth/jwt.module.js';
import { InterestRequest } from './entities/interest-request.entity.js';
import { ChatGateway } from './chat.gateway.js';
import { PresenceService } from './presence.service.js';
import { User } from '../auth/user.entity.js';
import { Listing } from '../listings/listing.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message, InterestRequest, User, Listing]),
    SharedJwtModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, PresenceService],
  exports: [ChatService],
})
export class ChatModule {}
