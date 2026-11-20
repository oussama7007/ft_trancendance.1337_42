import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { InterestRequest } from '../chat/entities/interest-request.entity.js';
import { Listing } from '../listings/listing.entity.js';
import { Handshake } from './entities/handshake.entity.js';
import { HandshakeController } from './handshake.controller.js';
import { HandshakeService } from './handshake.service.js';

// Groups everything about handshakes: the table, the routes and the logic.
// Listing gives the real owner, InterestRequest links a chat to its listing,
// and AuthModule gives the JWT tools the guard needs.
@Module({
  imports: [TypeOrmModule.forFeature([Handshake, Listing, InterestRequest]), AuthModule],
  controllers: [HandshakeController],
  providers: [HandshakeService],
  exports: [HandshakeService]
})
export class HandshakeModule {}
