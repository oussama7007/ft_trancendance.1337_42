import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { InterestRequest } from '../chat/entities/interest-request.entity.js';
import { Listing } from '../listings/listing.entity.js';
import { Handshake } from './entities/handshake.entity.js';
import { HandshakeController } from './handshake.controller.js';
import { HandshakeService } from './handshake.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Handshake, Listing, InterestRequest]), AuthModule],
  controllers: [HandshakeController],
  providers: [HandshakeService],
  exports: [HandshakeService]
})
export class HandshakeModule {}
