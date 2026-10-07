import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { RegistrationSession } from './registration-session-entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([RegistrationSession])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}