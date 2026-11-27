

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
import { PasswordResetToken } from './password-reset-challenge.entity.js';
import { TotpEnrollment } from './totp-enrollment.entity.js';
import { TotpRecoveryCode } from './totp-recovery-code.entity.js';
import { TotpService } from './totp.service.js';

import { ChangePasswordDto } from './dto/change-password.dto.js';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto.js';
import { VerifyPasswordResetDto } from './dto/verify-password-reset.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto.js';
import validator from 'validator';

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

const VERIFICATION_RESEND_COOLDOWN_MS = 2 * 60 * 1000;
const TOTP_LOGIN_CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const TOTP_MAX_ATTEMPTS = 5;
const RECOVERY_CODE_COUNT = 8;

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

    @InjectRepository(TotpEnrollment)
    private readonly totpEnrollmentRepository: Repository<TotpEnrollment>,

    @InjectRepository(TotpRecoveryCode)
    private readonly totpRecoveryCodeRepository: Repository<TotpRecoveryCode>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService,

    private readonly mailService: MailService,

    private readonly totpService: TotpService,
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

        if (credential) {
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: clientId,
            });
            payload = ticket.getPayload();
        } else if (accessToken) {
            const tokenInfo = await client.getTokenInfo(accessToken);

            const tokenAudience = (tokenInfo as any).audience;
            const tokenAzp = (tokenInfo as any).azp;
            if (tokenAudience !== clientId && tokenAzp !== clientId) {
                console.warn('Google token audience/azp mismatch:', {
                    tokenAudience,
                    tokenAzp,
                    clientId,
                });
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
        } else {
            throw new BadRequestException('Google credential is missing');
        }

        if (
            !payload ||
            !payload.sub ||
            !payload.email ||
            payload.email_verified !== true
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
      currentPassword?: string,
      code?: string,
  ) {
    const user = await this.userRepository.findOne({
        where: { id: userId },
    });

    if (!user) {
        throw new NotFoundException('User not found');
    }

    // Reauthenticate with current password for password-based accounts
    if (user.passwordHash) {
        const passwordMatches = await bcrypt.compare(
            currentPassword ?? '',
            user.passwordHash,
        );

        if (!passwordMatches) {
            throw new UnauthorizedException('Current password is incorrect');
        }
    }

    // Require TOTP verification if TOTP is enabled
    if (user.totpEnabled) {
        const validTotp = await this.verifyTotpCodeForReauth(user, code);

        if (!validTotp) {
            throw new UnauthorizedException('Invalid verification code');
        }
    }

    const identity = await this.verifyGoogleCredential(credential);

    const existingUser = await this.userRepository.findOne({
        where: { googleId: identity.googleId },
    });

    if (existingUser && existingUser.id !== userId) {
        throw new ConflictException(
            'This Google account is already connected to another user',
        );
    }

    user.googleId = identity.googleId;
    user.googleEmail = identity.googleEmail;

    await this.userRepository.save(user);

    return {
        message: 'Google account connected successfully',
    };
  }

  private async verifyTotpCodeForReauth(user: { totpEnabled: boolean; totpSecretEncrypted: string | null; id: number }, code?: string): Promise<boolean> {
    if (!user.totpEnabled || !user.totpSecretEncrypted || !code) {
        return false;
    }

    const secret = this.totpService.decryptSecret(user.totpSecretEncrypted);

    if (this.totpService.verifyToken(secret, code)) {
        return true;
    }

    const recoveryCode = await this.totpRecoveryCodeRepository.findOne({
        where: { userId: user.id, used: false },
    });

    if (recoveryCode) {
        const codeHash = this.totpService.hashToken(code);
        const isValidRecovery =
            codeHash.length === recoveryCode.codeHash.length &&
            timingSafeEqual(
                Buffer.from(codeHash),
                Buffer.from(recoveryCode.codeHash),
            );

        if (isValidRecovery) {
            recoveryCode.used = true;
            recoveryCode.usedAt = new Date();
            await this.totpRecoveryCodeRepository.save(recoveryCode);
            return true;
        }
    }

    return false;
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

  private async prepareLogin(user: User) {
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

    const nameValidator = (name: string) => {
        const nameWithoutSpaces = name.replace(/\s/g, '');
        return validator.isAlpha(nameWithoutSpaces) || validator.isAlpha(nameWithoutSpaces, 'ar');
    };

    if (!nameValidator(data.firstName)) {
      throw new BadRequestException('First and last name must contain only letters');
    }

    if (!nameValidator(data.lastName)) {
      throw new BadRequestException('First and last name must contain only letters');
    }

    if (data.firstName.length > 20 || data.lastName.length > 20) {
      throw new BadRequestException('Name is too long. Maximum 20 characters.');
    }

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

    if (!user)
      throw new NotFoundException('User not found');

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

    const user = await this.userRepository.findOne({
        where: { googleId: identity.googleId },
    });

    if (!user) {
        const emailUser = await this.userRepository.findOne({
            where: { email: identity.googleEmail.trim().toLowerCase() },
        });

        if (!emailUser) {
            throw new UnauthorizedException({
                code: 'GOOGLE_ACCOUNT_NOT_REGISTERED',
                message: 'This Google email is not registered in iRent',
            });
        }

        throw new UnauthorizedException({
            code: 'GOOGLE_ACCOUNT_NOT_LINKED',
            message: 'This Google account is not linked to your iRent account',
        });
    }

    // If TOTP 2FA is enforced, create a login challenge
    if (user.totpEnabled) {
        return this.createTotpLoginChallenge(user.id);
    }

    return this.prepareLogin(user);
  }

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

  // --- TOTP 2FA Setup ---

  async setupTotp(userId: number, currentPassword: string) {
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
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.totpEnrollmentRepository.delete({ userId });

    const secret = this.totpService.generateSecret();
    const encryptedSecret = this.totpService.encryptSecret(secret);
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.totpService.hashToken(token);

    const enrollment = this.totpEnrollmentRepository.create({
      userId,
      secretEncrypted: encryptedSecret,
      tokenHash,
      expiresAt: new Date(Date.now() + TOTP_LOGIN_CHALLENGE_TTL_MS),
      attempts: 0,
    });

    await this.totpEnrollmentRepository.save(enrollment);

    const provisioningUri = this.totpService.generateProvisioningUri(
      user.email,
      secret,
    );

    return {
      token,
      qrCodeUrl: provisioningUri,
      secret: this.totpService.decryptSecret(encryptedSecret),
    };
  }

  async verifyTotpSetup(userId: number, token: string, code: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const enrollment = await this.totpEnrollmentRepository.findOne({
      where: { userId },
    });

    if (!enrollment) {
      throw new BadRequestException('No pending TOTP enrollment found');
    }

    if (enrollment.expiresAt.getTime() < Date.now()) {
      await this.totpEnrollmentRepository.delete(enrollment.id);
      throw new BadRequestException('TOTP enrollment has expired');
    }

    if (enrollment.attempts >= TOTP_MAX_ATTEMPTS) {
      await this.totpEnrollmentRepository.delete(enrollment.id);
      throw new BadRequestException(
        'tooManyTOTPAttempts',
      );
    }

    const providedHash = this.totpService.hashToken(token);
    const isValidToken =
      providedHash.length === enrollment.tokenHash.length &&
      timingSafeEqual(
        Buffer.from(providedHash),
        Buffer.from(enrollment.tokenHash),
      );

    if (!isValidToken) {
      enrollment.attempts += 1;
      await this.totpEnrollmentRepository.save(enrollment);
      throw new BadRequestException('Invalid enrollment token');
    }

    if (!enrollment.secretEncrypted) {
      await this.totpEnrollmentRepository.delete(enrollment.id);
      throw new BadRequestException('No pending TOTP enrollment found');
    }

    const secret = this.totpService.decryptSecret(enrollment.secretEncrypted);

    if (!this.totpService.verifyToken(secret, code)) {
      enrollment.attempts += 1;
      await this.totpEnrollmentRepository.save(enrollment);
      throw new BadRequestException('Invalid TOTP verification code');
    }

    // Generate recovery codes
    const recoveryCodes = this.totpService.generateRecoveryCodes(
      RECOVERY_CODE_COUNT,
    );
    const codeHashes = recoveryCodes.map((code) => ({
      userId,
      codeHash: this.totpService.hashToken(code),
      used: false,
    }));

    await this.totpRecoveryCodeRepository.delete({ userId });
    await this.totpRecoveryCodeRepository.save(codeHashes);

    // Activate TOTP
    user.totpEnabled = true;
    user.totpSecretEncrypted = enrollment.secretEncrypted;
    user.totpLastUsedStep = null;

    await this.userRepository.save(user);
    await this.totpEnrollmentRepository.delete(enrollment.id);

    return {
      recoveryCodes,
      message: 'TOTP two-factor authentication enabled successfully',
    };
  }

  // --- TOTP Login Challenge ---

  private async createTotpLoginChallenge(userId: number) {
    // Clean up any existing challenge
    await this.totpEnrollmentRepository.delete({ userId });

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.totpService.hashToken(token);

    const challenge = this.totpEnrollmentRepository.create({
      userId,
      secretEncrypted: '', // not used for login challenge
      tokenHash,
      expiresAt: new Date(Date.now() + TOTP_LOGIN_CHALLENGE_TTL_MS),
      attempts: 0,
    });

    await this.totpEnrollmentRepository.save(challenge);

    return {
      requiresTwoFactor: true,
      challengeToken: token,
      message: 'TOTP verification required',
    };
  }

  async verifyTotpLogin(challengeToken: string, code: string) {
    const tokenHash = this.totpService.hashToken(challengeToken);

    const challenge = await this.totpEnrollmentRepository.findOne({
      where: { tokenHash },
    });

    if (!challenge) {
      throw new UnauthorizedException('Login challenge is invalid');
    }

    if (challenge.expiresAt.getTime() < Date.now()) {
      await this.totpEnrollmentRepository.delete(challenge.id);
      throw new UnauthorizedException('Login challenge expired');
    }

    if (challenge.attempts >= TOTP_MAX_ATTEMPTS) {
      await this.totpEnrollmentRepository.delete(challenge.id);
      throw new UnauthorizedException(
        'Too many incorrect attempts. Please log in again.',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: challenge.userId },
    });

    if (!user || !user.totpEnabled || !user.totpSecretEncrypted) {
      await this.totpEnrollmentRepository.delete(challenge.id);
      throw new UnauthorizedException(
        'Login challenge is no longer valid',
      );
    }

    const secret = this.totpService.decryptSecret(user.totpSecretEncrypted);

    // Try TOTP code first
    let isValid = this.totpService.verifyToken(secret, code);

    // If not valid, try recovery codes
    let recoveryCodeUsed = false;
    if (!isValid) {
      const recoveryCode = await this.totpRecoveryCodeRepository.findOne({
        where: { userId: user.id, used: false },
      });

      if (recoveryCode) {
        const codeHash = this.totpService.hashToken(code);
        const isValidRecovery =
          codeHash.length === recoveryCode.codeHash.length &&
          timingSafeEqual(
            Buffer.from(codeHash),
            Buffer.from(recoveryCode.codeHash),
          );

        if (isValidRecovery) {
          recoveryCode.used = true;
          recoveryCode.usedAt = new Date();
          await this.totpRecoveryCodeRepository.save(recoveryCode);
          isValid = true;
          recoveryCodeUsed = true;
        }
      }
    }

    if (!isValid) {
      challenge.attempts += 1;
      await this.totpEnrollmentRepository.save(challenge);
      throw new UnauthorizedException('Invalid verification code');
    }

    await this.totpEnrollmentRepository.delete(challenge.id);

    return this.issueAuthenticatedSession(user);
  }

  // --- TOTP Disable ---

  async disableTotp(
    userId: number,
    currentPassword: string,
    code: string,
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
      throw new UnauthorizedException('Current password is incorrect');
    }

    const secret = user.totpSecretEncrypted
      ? this.totpService.decryptSecret(user.totpSecretEncrypted)
      : null;

    let isValid = false;

    if (secret && this.totpService.verifyToken(secret, code)) {
      isValid = true;
    }

    if (!isValid) {
      // Try recovery code
      const recoveryCode = await this.totpRecoveryCodeRepository.findOne({
        where: { userId, used: false },
      });

      if (recoveryCode) {
        const codeHash = this.totpService.hashToken(code);
        const isValidRecovery =
          codeHash.length === recoveryCode.codeHash.length &&
          timingSafeEqual(
            Buffer.from(codeHash),
            Buffer.from(recoveryCode.codeHash),
          );

        if (isValidRecovery) {
          recoveryCode.used = true;
          recoveryCode.usedAt = new Date();
          await this.totpRecoveryCodeRepository.save(recoveryCode);
          isValid = true;
        }
      }
    }

    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    user.totpEnabled = false;
    user.totpSecretEncrypted = null;
    user.totpLastUsedStep = null;

    await this.totpRecoveryCodeRepository.delete({ userId });
    await this.userRepository.save(user);

    return this.getSecuritySettings(userId);
  }

  async regenerateRecoveryCodes(userId: number, currentPassword: string) {
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
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (!user.totpEnabled) {
      throw new BadRequestException('TOTP is not enabled');
    }

    await this.totpRecoveryCodeRepository.delete({ userId });

    const recoveryCodes = this.totpService.generateRecoveryCodes(
      RECOVERY_CODE_COUNT,
    );
    const codeHashes = recoveryCodes.map((code) => ({
      userId,
      codeHash: this.totpService.hashToken(code),
      used: false,
    }));

    await this.totpRecoveryCodeRepository.save(codeHashes);

    return {
      recoveryCodes,
      message: 'Recovery codes regenerated successfully',
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

    // If TOTP 2FA is enabled, create a login challenge instead of issuing JWT directly
    if (user.totpEnabled) {
        return this.createTotpLoginChallenge(user.id);
    }

    return this.prepareLogin(user);

  }

  async getSecuritySettings(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      totp2faEnabled: user.totpEnabled,
      googleEmail: user.googleEmail,
      googleLinked: Boolean(user.googleId),
    };
  }

}
