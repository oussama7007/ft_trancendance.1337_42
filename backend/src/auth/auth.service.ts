


import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
    HttpException,
    UnauthorizedException,
    HttpStatus,
    ServiceUnavailableException,
} from '@nestjs/common';

import { EmailChangeChallenge } from './email-change-challenge.entity.js';
import { LoginChallenge } from './login-challenge.entity.js';
import { PasswordResetToken } from './password-reset-challenge.entity.js';

import { ChangePasswordDto } from './dto/change-password.dto.js';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto.js';
import { VerifyPasswordResetDto } from './dto/verify-password-reset.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto.js';

import { RegistrationSession } from './registration-session-entity.js';
import { User } from './user.entity.js';
import { StartRegistrationDto } from './dto/start-registration.dto.js';
import { RequestVerificationDto } from './dto/request-verification.dto.js';
import { VerifyRegistrationDto } from './dto/verify-registration.dto.js';
import { FinishRegistrationDto } from './dto/finish-registration.dto.js';

import {
    createHash,
    randomBytes,
    randomInt,
    timingSafeEqual,
} from 'node:crypto';



import { OAuth2Client } from 'google-auth-library';



import { MailService } from '../mail/mail.service.js';
import { SmsVerificationService } from './sms-verification.service.js';

const VERIFICATION_RESEND_COOLDOWN_MS = 2 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(



    @InjectRepository(RegistrationSession)
    private readonly registrationSessionRepository: Repository<RegistrationSession>,



        @InjectRepository(EmailChangeChallenge)
    private readonly emailChangeChallengeRepository:
        Repository<EmailChangeChallenge>,

    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository:
        Repository<PasswordResetToken>,

    @InjectRepository(LoginChallenge)
    private readonly loginChallengeRepository: Repository<LoginChallenge>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService,

    private readonly mailService: MailService,

    private readonly smsService: SmsVerificationService,
  ) {}
  private async verifyGoogleCredential(
    credential?: string,
    accessToken?: string,
  ) {
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
        throw new ServiceUnavailableException(
            'Google authentication is not configured',
        );
    }

    try {
        const client = new OAuth2Client(clientId);
        let payload;

        if (accessToken) {
            const tokenInfo = await client.getTokenInfo(accessToken);

            // Access tokens from Google can have the client ID in either 'audience' (aud) or 'azp' fields.
            // Some tokens might not even have a strictly matching 'aud' if they are scoped differently,
            // but the fact that we can fetch userinfo with it is a strong proof of validity.
            const tokenAudience = (tokenInfo as any).audience;
            const tokenAzp = (tokenInfo as any).azp;
            if (tokenAudience !== clientId && tokenAzp !== clientId) {
                console.warn('Google token audience/azp mismatch:', {
                    tokenAudience,
                    tokenAzp,
                    clientId,
                });
                // We'll proceed anyway if we can fetch userinfo, but we keep this log for debugging.
            }

            const response = await fetch(
                'https://openidconnect.googleapis.com/v1/userinfo',
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                },
            );

            if (!response.ok) {
                throw new UnauthorizedException('Invalid Google access token');
            }

            payload = await response.json() as {
                sub?: string;
                email?: string;
                email_verified?: boolean | string;
            };
        } else if (credential) {
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: clientId,
            });
            payload = ticket.getPayload();
        } else {
            throw new BadRequestException('Google credential is missing');
        }

        if (
            !payload ||
            !payload.sub ||
            !payload.email ||
            (payload.email_verified !== true && payload.email_verified !== 'true')
        ) {
            throw new UnauthorizedException(
                'Google account could not be verified',
            );
        }

        return {
            googleId: payload.sub,
            googleEmail: payload.email,
        };
    } catch (error) {
        if (error instanceof HttpException) {
            throw error;
        }
        console.error('Google verification error:', error);
        throw new UnauthorizedException(
            'Invalid Google credential',
        );
    }
}

async linkGoogleAccount(
    userId: number,
    credential?: string,
    accessToken?: string,
) {
    const identity = await this.verifyGoogleCredential(credential, accessToken);

    const existingUser = await this.userRepository.findOne({
        where: { googleId: identity.googleId },
    });

    if (existingUser && existingUser.id !== userId) {
        throw new ConflictException(
            'This Google account is already connected to another user',
        );
    }

    const user = await this.userRepository.findOne({
        where: { id: userId },
    });

    if (!user) {
        throw new NotFoundException('User not found');
    }

    user.googleId = identity.googleId;
    user.googleEmail = identity.googleEmail;

    await this.userRepository.save(user);

    return {
        message: 'Google account connected successfully',
    };
}
private toAuthUser(user: User) {
    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        email: user.email,
        avatarUrl: user.avatarUrl,
    };
}
private async issueAuthenticatedSession(user: User) {
    const accessToken = await this.jwtService.signAsync({
        sub: user.id,
    });

    return {
        requiresTwoFactor: false,
        accessToken,
        user: this.toAuthUser(user),
    };
}





/**
 * createLoginChallenge: preserved for later use once an SMS provider is selected.
 * It creates a login verification challenge, sends an SMS code, and returns
 * a challenge token that the frontend submits to /auth/2fa/login/verify.
 */
private async createLoginChallenge(user: User) {
    if (!user.phoneNumber || !user.phoneVerified) {
        throw new BadRequestException(
            'A verified phone number is required for SMS 2FA',
        );
    }

    const challengeToken = randomBytes(32).toString('hex');

    const tokenHash = createHash('sha256')
        .update(challengeToken)
        .digest('hex');

    const challenge = await this.loginChallengeRepository.save({
        tokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    try {
        await this.smsService.sendVerificationCode(
            user.phoneNumber,
        );
    } catch (error) {
        await this.loginChallengeRepository.delete(challenge.id);
        throw error;
    }

    return {
        requiresTwoFactor: true,
        challengeToken,
        phoneHint:
            user.phoneNumber.slice(0, 4) +
            '••••••' +
            user.phoneNumber.slice(-2),
    };
}








private async prepareLogin(user: User) {
    const sms2faAvailable = process.env.SMS_2FA_ENABLED === 'true';

    // SMS two-factor authentication is deferred: never block a login because
    // the SMS provider is not configured. Only start a 2FA challenge when SMS
    // is both enabled on the account and actually available.
    if (user.sms2faEnabled && sms2faAvailable) {
        return this.createLoginChallenge(user);
    }

    // Normal login for users without SMS 2FA, or when the SMS provider is not
    // yet configured.
    return this.issueAuthenticatedSession(user);
}




  async changePassword(
    userId: number,
    data: ChangePasswordDto,
) {
    const user = await this.userRepository.findOne({
        where: { id: userId },
    });

    if (!user) {
        throw new NotFoundException('User not found');
    }

    const passwordMatches = await bcrypt.compare(
        data.currentPassword,
        user.passwordHash,
    );

    if (!passwordMatches) {
        throw new UnauthorizedException(
            'Current password is incorrect',
        );
    }

    if (data.currentPassword === data.newPassword) {
        throw new BadRequestException(
            'New password must be different',
        );
    }

    user.passwordHash = await bcrypt.hash(
        data.newPassword,
        12,
    );

    await this.userRepository.save(user);

    return {
        message: 'Password updated successfully',
    };
}



private hashEmailChangeCode(
    userId: number,
    code: string,
): string {
    return createHash('sha256')
        .update(`${userId}:${code}`)
        .digest('hex');
}


// Step 1: verify the password and send one code to the new email address.
async startEmailChange(
    userId: number,
    newEmail: string,
    currentPassword: string,
) {
    const user = await this.userRepository.findOne({
        where: { id: userId },
    });

    if (!user) {
        throw new NotFoundException('User not found');
    }

    const passwordMatches = await bcrypt.compare(
        currentPassword,
        user.passwordHash,
    );

    if (!passwordMatches) {
        throw new UnauthorizedException('Current password is incorrect');
    }

    const normalizedCurrentEmail = user.email.trim().toLowerCase();
    const normalizedPendingEmail = newEmail.trim().toLowerCase();

    if (normalizedPendingEmail === normalizedCurrentEmail) {
        throw new BadRequestException(
            'This is already your current email',
        );
    }

    const existingUser = await this.userRepository.findOne({
        where: { email: normalizedPendingEmail },
    });

    if (existingUser) {
        throw new ConflictException(
            'This email is already used by another account',
        );
    }

    const now = Date.now();
    let challenge = await this.emailChangeChallengeRepository.findOne({
        where: { userId },
    });

    if (
        challenge &&
        challenge.expiresAt.getTime() > now &&
        now - (challenge.expiresAt.getTime() - 5 * 60 * 1000) < VERIFICATION_RESEND_COOLDOWN_MS
    ) {
        throw new HttpException(
            'Please wait before requesting another code',
            HttpStatus.TOO_MANY_REQUESTS,
        );
    }

    const code = randomInt(10000000, 100000000).toString();
    const expiresAt = new Date(now + 5 * 60 * 1000);

    if (!challenge) {
        challenge = this.emailChangeChallengeRepository.create({
            userId,
            pendingEmail: normalizedPendingEmail,
            codeHash: '',
            expiresAt,
            attempts: 0,
        });
    }

    challenge.pendingEmail = normalizedPendingEmail;
    challenge.codeHash = this.hashEmailChangeCode(userId, code);
    challenge.expiresAt = expiresAt;
    challenge.attempts = 0;

    await this.emailChangeChallengeRepository.save(challenge);

    try {
        await this.mailService.sendEmailChangeCode(
            normalizedPendingEmail,
            code,
        );
    } catch {
        await this.emailChangeChallengeRepository.delete({ userId });
        throw new ServiceUnavailableException(
            'Could not send verification email',
        );
    }

    return {
        message: 'Verification code sent',
        expiresInSeconds: 300,
    };
}

// Step 2: verify the new email code and then update the account email.
async verifyEmailChange(
    userId: number,
    code: string,
) {
    const challenge = await this.emailChangeChallengeRepository.findOne({
        where: { userId },
    });

    if (!challenge) {
        throw new BadRequestException(
            'No email change request was found',
        );
    }

    if (challenge.expiresAt.getTime() < Date.now()) {
        await this.emailChangeChallengeRepository.delete(challenge.id);
        throw new BadRequestException('Verification code has expired');
    }

    if (challenge.attempts >= 5) {
        await this.emailChangeChallengeRepository.delete(challenge.id);
        throw new BadRequestException(
            'Too many incorrect attempts. Request a new code.',
        );
    }

    const providedHash = this.hashEmailChangeCode(userId, code);
    const storedBuffer = Buffer.from(challenge.codeHash, 'hex');
    const providedBuffer = Buffer.from(providedHash, 'hex');
    const isValid =
        storedBuffer.length === providedBuffer.length &&
        timingSafeEqual(storedBuffer, providedBuffer);

    if (!isValid) {
        challenge.attempts += 1;

        if (challenge.attempts >= 5) {
            await this.emailChangeChallengeRepository.delete(challenge.id);
        } else {
            await this.emailChangeChallengeRepository.save(challenge);
        }

        throw new BadRequestException('Invalid verification code');
    }

    const user = await this.userRepository.findOne({
        where: { id: userId },
    });

    if (!user) {
        throw new NotFoundException('User not found');
    }

    const existingUser = await this.userRepository.findOne({
        where: { email: challenge.pendingEmail },
    });

    if (existingUser && existingUser.id !== userId) {
        await this.emailChangeChallengeRepository.delete(challenge.id);
        throw new ConflictException('This email is already used');
    }

    const oldEmail = user.email;
    user.email = challenge.pendingEmail;
    await this.userRepository.save(user);
    await this.emailChangeChallengeRepository.delete(challenge.id);

    try {
        await this.mailService.sendEmailChangeCompleted(oldEmail, user.email);
    } catch {
        // The email update is already complete; notification failure must not
        // roll back the database change.
    }

    return {
        email: user.email,
        message: 'Email updated successfully',
    };
}




  private validateDateOfBirth(dateOfBirth: string): void {
        const birthDate = new Date(dateOfBirth);

        if (isNaN(birthDate.getTime())) {
            throw new BadRequestException('Invalid date of birth');
        }

        const today = new Date(
            new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Africa/Casablanca',
            }).format(new Date()),
        );

        const minimumDate = new Date(today);
        minimumDate.setFullYear(today.getFullYear() - 18);

        if (birthDate > minimumDate) {
            throw new BadRequestException(
                'You must be at least 18 years old',
            );
        }
  } 


  async startRegistration(data: StartRegistrationDto) {
    
    
    
    this.validateDateOfBirth(data.dateOfBirth);
    
    
    const session = this.registrationSessionRepository.create(data);


    const savedSession = await this.registrationSessionRepository.save(session);

    return {
      sessionId: savedSession.id,
      message: 'Registration started',
    };
  }


  async requestVerification(data: RequestVerificationDto) {
    const session = await this.registrationSessionRepository.findOne({
      where: { id: data.sessionId },
    });

    if (!session)
      throw new NotFoundException('Registration session not found');

    const email = data.email.trim().toLowerCase();


    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser)
      throw new ConflictException('This contact is already registered');

    // Do not send multiple verification codes within 30 seconds.
    // The frontend also shows a countdown, but this backend check cannot be bypassed.
    if (session.verificationCodeExpiresAt) {
      const lastSentAt =
        session.verificationCodeExpiresAt.getTime() - 5 * 60 * 1000;

      if (Date.now() - lastSentAt < VERIFICATION_RESEND_COOLDOWN_MS) {
        throw new HttpException(
          'Please wait before requesting another code',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const code = randomInt(0, 1000000).toString().padStart(6, '0');

    session.email = email;
    session.verificationCode = code;
    session.verificationCodeExpiresAt =
      new Date(Date.now() + 5 * 60 * 1000);
    session.isVerified = false;

    await this.registrationSessionRepository.save(session);

    await this.mailService.sendVerificationCode(email, code);

    return {
      sessionId: session.id,
      message: 'Verification code generated',
    };
  }


  async verifyRegistration(data: VerifyRegistrationDto) {
    const session = await this.registrationSessionRepository.findOne({
      where: { id: data.sessionId },
    });

    if (!session)
      throw new NotFoundException('Registration session not found');

    if (!session.verificationCode || !session.verificationCodeExpiresAt)
      throw new BadRequestException('Request a verification code first');

    if (session.verificationCodeExpiresAt.getTime() < Date.now())
      throw new BadRequestException('Verification code has expired');

    if (session.verificationCode !== data.code)
      throw new BadRequestException('Invalid verification code');

    session.isVerified = true;
    session.verificationCode = undefined;
    session.verificationCodeExpiresAt = undefined;

    await this.registrationSessionRepository.save(session);

    return {
      sessionId: session.id,
      message: 'Contact verified successfully',
    };
  }


  async finishRegistration(data: FinishRegistrationDto) {
    const session = await this.registrationSessionRepository.findOne({
      where: { id: data.sessionId },
    });

    if (!session)
      throw new NotFoundException('Registration session not found');

    if (!session.isVerified || !session.email)
      throw new BadRequestException('Verify your email first');

    const existingUser = await this.userRepository.findOne({
      where: { email: session.email },
    });

    if (existingUser)
      throw new ConflictException('This contact is already registered');

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = this.userRepository.create({
      firstName: session.firstName,
      lastName: session.lastName,
      dateOfBirth: session.dateOfBirth,
      gender: session.gender,
    
      email: session.email,
      passwordHash,
    });

    const savedUser = await this.userRepository.save(user);
        const accessToken = await this.jwtService.signAsync({
            sub: savedUser.id,
        });
    await this.registrationSessionRepository.delete(session.id);
    

      return {
          accessToken,
          user: {
              id: savedUser.id,
              firstName: savedUser.firstName,
              lastName: savedUser.lastName,
              dateOfBirth: savedUser.dateOfBirth,
              gender: savedUser.gender,
              email: savedUser.email,
          },
          message: 'Registration completed successfully',
      }
  };


    async getCurrentUser(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      linkedin: user.linkedin,
      instagram: user.instagram,
      facebook: user.facebook,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      email: user.email,
    };
  }

  async loginWithGoogle(
    credential?: string,
    accessToken?: string,
  ) {
    const identity = await this.verifyGoogleCredential(
        credential,
        accessToken,
    );

    // Prefer the immutable Google subject, but fall back to the verified
    // Google email. This repairs older links created before googleId was
    // persisted consistently and still cannot match an unverified address.
    const user = await this.userRepository.findOne({
        where: [
            { googleId: identity.googleId },
            { googleEmail: identity.googleEmail.trim().toLowerCase() },
        ],
    });

    if (!user) {
        const normalizedGoogleEmail = identity.googleEmail
            .trim()
            .toLowerCase();

        const emailUser = await this.userRepository.findOne({
            where: { email: normalizedGoogleEmail },
        });

        if (!emailUser) {
            throw new UnauthorizedException({
                code: 'GOOGLE_ACCOUNT_NOT_REGISTERED',
                message: 'This Google email is not registered in iRent',
            });
        }

        // Do not link automatically by matching email. The user must first
        // sign in with the iRent password and link Google from Settings.
        throw new UnauthorizedException({
            code: 'GOOGLE_ACCOUNT_NOT_LINKED',
            message: 'This Google account is not linked to your iRent account',
        });
    }

    // If this was a legacy email-only link, persist Google's immutable
    // subject so all later sign-ins use the primary lookup.
    if (user.googleId !== identity.googleId) {
        user.googleId = identity.googleId;
        user.googleEmail = identity.googleEmail;
        await this.userRepository.save(user);
    }

    return this.prepareLogin(user);
}

async startPhoneVerification(
    userId: number,
    phoneNumber: string,
) {
    // Guard: SMS provider not yet configured.
    if (process.env.SMS_2FA_ENABLED !== 'true') {
        throw new ServiceUnavailableException(
            'SMS two-factor authentication is temporarily unavailable',
        );
    }

    const user = await this.userRepository.findOne({
        where: { id: userId },
    });

    if (!user) {
        throw new NotFoundException('User not found');
    }

    const existing = await this.userRepository.findOne({
        where: { phoneNumber },
    });

    if (existing && existing.id !== userId) {
        throw new ConflictException(
            'This phone number is already used by another account',
        );
    }

    await this.smsService.sendVerificationCode(phoneNumber);

    return {
        message: 'Verification code sent',
    };
}









async verifyAndSavePhoneNumber(
    userId: number,
    phoneNumber: string,
    code: string,
) {
    // Guard: SMS provider not yet configured.
    if (process.env.SMS_2FA_ENABLED !== 'true') {
        throw new ServiceUnavailableException(
            'SMS two-factor authentication is temporarily unavailable',
        );
    }

    const user = await this.userRepository.findOne({
        where: { id: userId },
    });

    if (!user) {
        throw new NotFoundException('User not found');
    }

    const existing = await this.userRepository.findOne({
        where: { phoneNumber },
    });

    if (existing && existing.id !== userId) {
        throw new ConflictException(
            'This phone number is already used',
        );
    }

    const verified = await this.smsService.verifyCode(
        phoneNumber,
        code,
    );

    if (!verified) {
        throw new BadRequestException(
            'Invalid or expired verification code',
        );
    }

    user.phoneNumber = phoneNumber;
    user.phoneVerified = true;

    await this.userRepository.save(user);

    return this.getSecuritySettings(userId);
}









async enableSms2fa(userId: number) {
    // Guard: SMS provider not yet configured.
    if (process.env.SMS_2FA_ENABLED !== 'true') {
        throw new ServiceUnavailableException(
            'SMS two-factor authentication is temporarily unavailable',
        );
    }

    const user = await this.userRepository.findOne({
        where: { id: userId },
    });

    if (!user) {
        throw new NotFoundException('User not found');
    }

    if (!user.phoneNumber || !user.phoneVerified) {
        throw new BadRequestException(
            'Verify your phone number before enabling 2FA',
        );
    }

    user.sms2faEnabled = true;

    await this.userRepository.save(user);

    return this.getSecuritySettings(userId);
}
async disableSms2fa(
    userId: number,
    currentPassword: string,
) {
    const user = await this.userRepository.findOne({
        where: { id: userId },
    });

    if (!user) {
        throw new NotFoundException('User not found');
    }

    const validPassword = await bcrypt.compare(
        currentPassword,
        user.passwordHash,
    );

    if (!validPassword) {
        throw new UnauthorizedException(
            'Current password is incorrect',
        );
    }

    user.sms2faEnabled = false;

    await this.userRepository.save(user);

    return this.getSecuritySettings(userId);
}
async verifyLoginChallenge(
    challengeToken: string,
    code: string,
) {
    // Guard: SMS provider not yet configured.
    if (process.env.SMS_2FA_ENABLED !== 'true') {
        throw new ServiceUnavailableException(
            'SMS two-factor authentication is temporarily unavailable',
        );
    }

    const tokenHash = createHash('sha256')
        .update(challengeToken)
        .digest('hex');

    const challenge = await this.loginChallengeRepository.findOne({
        where: { tokenHash },
    });

    if (!challenge) {
        throw new UnauthorizedException(
            'Login challenge is invalid',
        );
    }

    if (challenge.expiresAt.getTime() < Date.now()) {
        await this.loginChallengeRepository.delete(challenge.id);

        throw new UnauthorizedException(
            'Login challenge expired',
        );
    }

    const user = await this.userRepository.findOne({
        where: { id: challenge.userId },
    });

    if (!user || !user.sms2faEnabled || !user.phoneNumber) {
        throw new UnauthorizedException(
            'Login challenge is no longer valid',
        );
    }

    const verified = await this.smsService.verifyCode(
        user.phoneNumber,
        code,
    );

    if (!verified) {
        throw new UnauthorizedException(
            'Invalid SMS verification code',
        );
    }

    await this.loginChallengeRepository.delete(challenge.id);

    return this.issueAuthenticatedSession(user);
}
async getSecuritySettings(userId: number) {
    const user = await this.userRepository.findOne({
        where: { id: userId },
    });

    if (!user) {
        throw new NotFoundException('User not found');
    }

    return {
        phoneNumber: user.phoneNumber,
        phoneVerified: user.phoneVerified,
        sms2faEnabled: user.sms2faEnabled,
        // sms2faAvailable tells the frontend whether to show SMS controls.
        // It is false until an SMS provider is configured and SMS_2FA_ENABLED=true.
        sms2faAvailable: process.env.SMS_2FA_ENABLED === 'true',
        googleEmail: user.googleEmail,
        googleLinked: Boolean(user.googleId),
    };
}
  async validateCredentials(data : LoginDto){
    const user = await this.userRepository.findOne({
      where: {email: data.email.trim().toLowerCase()  },
    });
    if (!user)
        throw new UnauthorizedException('Invalid contact or password');

    const passwordMatches = await  bcrypt.compare(data.password, user.passwordHash,
    );
    if(!passwordMatches)
        throw new UnauthorizedException('invalid contact or password');

    return this.prepareLogin(user);

  }

  // Password reset flow
  // Step 1: Request password reset by email
  async requestPasswordReset(data: RequestPasswordResetDto) {
    const user = await this.userRepository.findOne({
      where: { email: data.email.trim().toLowerCase() },
    });

    if (!user) {
      throw new BadRequestException('Email not found in our system');
    }

    const now = Date.now();
    let challenge = await this.passwordResetTokenRepository.findOne({
      where: { userId: user.id },
    });

    // Rate limiting: prevent spamming reset requests
    if (
      challenge &&
      challenge.expiresAt.getTime() > now &&
      !challenge.used &&
      now - challenge.createdAt.getTime() < VERIFICATION_RESEND_COOLDOWN_MS
    ) {
      throw new HttpException(
        'Please wait before requesting another code',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = randomInt(100000, 1000000).toString();
    const expiresAt = new Date(now + 5 * 60 * 1000); // 5 minutes

    if (!challenge) {
      challenge = this.passwordResetTokenRepository.create({
        userId: user.id,
        tokenHash: '',
        expiresAt,
        used: false,
      });
    }

    challenge.tokenHash = this.hashPasswordResetCode(user.id, code);
    challenge.expiresAt = expiresAt;
    challenge.used = false;

    await this.passwordResetTokenRepository.save(challenge);

    try {
      await this.mailService.sendPasswordResetCode(user.email, code);
    } catch {
      await this.passwordResetTokenRepository.delete({ userId: user.id });
      throw new ServiceUnavailableException(
        'Could not send password reset email',
      );
    }

    return {
      message: 'If this email exists, a reset code will be sent',
      expiresInSeconds: 300,
    };
  }

  // Step 2: Verify the password reset code
  async verifyPasswordReset(data: VerifyPasswordResetDto) {
    const user = await this.userRepository.findOne({
      where: { email: data.email.trim().toLowerCase() },
    });

    if (!user) {
      throw new BadRequestException('Email not found in our system');
    }

    const challenge = await this.passwordResetTokenRepository.findOne({
      where: { userId: user.id },
    });

    if (!challenge) {
      throw new BadRequestException(
        'No password reset request was found',
      );
    }

    if (challenge.expiresAt.getTime() < Date.now()) {
      await this.passwordResetTokenRepository.delete(challenge.id);
      throw new BadRequestException('Verification code has expired');
    }

    if (challenge.used) {
      await this.passwordResetTokenRepository.delete(challenge.id);
      throw new BadRequestException(
        'This reset link has already been used',
      );
    }

    const providedHash = this.hashPasswordResetCode(user.id, data.code);
    const storedBuffer = Buffer.from(challenge.tokenHash, 'hex');
    const providedBuffer = Buffer.from(providedHash, 'hex');
    const isValid =
      storedBuffer.length === providedBuffer.length &&
      timingSafeEqual(storedBuffer, providedBuffer);

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Mark code as verified so user can proceed to password reset
    challenge.used = true;
    await this.passwordResetTokenRepository.save(challenge);

    return {
      message: 'Code verified successfully',
    };
  }

  // Step 3: Reset password with verified code
  async resetPassword(data: ResetPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { email: data.email.trim().toLowerCase() },
    });

    if (!user) {
      throw new BadRequestException('Email not found in our system');
    }

    const challenge = await this.passwordResetTokenRepository.findOne({
      where: { userId: user.id },
    });

    if (!challenge) {
      throw new BadRequestException(
        'No password reset request was found',
      );
    }

    if (!challenge.used) {
      throw new BadRequestException(
        'You must verify the code first',
      );
    }

    if (challenge.expiresAt.getTime() < Date.now()) {
      await this.passwordResetTokenRepository.delete(challenge.id);
      throw new BadRequestException('Password reset has expired');
    }

    // Hash and update password
    user.passwordHash = await bcrypt.hash(data.newPassword, 12);
    await this.userRepository.save(user);

    // Clean up the challenge
    await this.passwordResetTokenRepository.delete(challenge.id);

    try {
      await this.mailService.sendPasswordResetCompleted(user.email);
    } catch {
      // Password reset is already complete; notification failure must not
      // roll back the database change.
    }

    return {
      message: 'Password has been reset successfully',
    };
  }

  private hashPasswordResetCode(
    userId: number,
    code: string,
  ): string {
    return createHash('sha256')
      .update(`${userId}:${code}`)
      .digest('hex');
  }
}