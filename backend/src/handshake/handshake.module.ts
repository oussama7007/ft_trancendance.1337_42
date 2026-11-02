import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Handshake } from './entities/handshake.entity.js';
import { HandshakeController } from './handshake.controller.js';
import { HandshakeService } from './handshake.service.js';

// Groups everything about handshakes: the table, the routes and the logic.
// The service is exported so other modules (feedback, for example) can use it.
@Module({
  imports: [TypeOrmModule.forFeature([Handshake])],
  controllers: [HandshakeController],
  providers: [HandshakeService],
  exports: [HandshakeService]
})
export class HandshakeModule {}
