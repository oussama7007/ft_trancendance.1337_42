import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { RegistrationSession } from './registration-session-entity.js';
import { User } from './user.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([RegistrationSession, User])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}