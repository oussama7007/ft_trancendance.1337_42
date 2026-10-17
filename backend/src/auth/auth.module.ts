import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { RegistrationSession } from './registration-session-entity.js';
import { User } from './user.entity.js';
import { SharedJwtModule } from './jwt.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([RegistrationSession, User]),
    SharedJwtModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}