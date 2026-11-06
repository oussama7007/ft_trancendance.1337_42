import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { RegistrationSession } from './registration-session-entity.js';
import { User } from './user.entity.js';
import { MailService } from '../mail/mail.service.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([RegistrationSession, User]),
    
    JwtModule.registerAsync({
      imports: [ConfigModule], 
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        
          secret: configService.getOrThrow<string>('JWT_SECRET'),
          signOptions: { expiresIn: '15m' },
      })
      

    })
  ],
  controllers: [AuthController],
  providers: [AuthService, MailService],
})
export class AuthModule {}