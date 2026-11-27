import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { RegistrationSession } from './registration-session-entity.js';
import { User } from './user.entity.js';
import { SharedJwtModule } from './jwt.module.js';
import { MailService } from '../mail/mail.service.js';

import { EmailChangeChallenge } from './email-change-challenge.entity.js';
import { PasswordResetToken } from './password-reset-challenge.entity.js';
import { TotpEnrollment } from './totp-enrollment.entity.js';
import { TotpRecoveryCode } from './totp-recovery-code.entity.js';
import { TotpService } from './totp.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RegistrationSession,
      User,
      EmailChangeChallenge,
      PasswordResetToken,
      TotpEnrollment,
      TotpRecoveryCode,
    ]),
    SharedJwtModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, MailService, TotpService],
  exports: [SharedJwtModule],
})
export class AuthModule {}
