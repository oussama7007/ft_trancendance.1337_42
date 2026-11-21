


import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
      
    ServiceUnavailableException,
} from '@nestjs/common';




import { ChangePasswordDto } from './dto/change-password.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { randomInt } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto.js';

import { RegistrationSession } from './registration-session-entity.js';
import { User } from './user.entity.js';
import { StartRegistrationDto } from './dto/start-registration.dto.js';
import { RequestVerificationDto } from './dto/request-verification.dto.js';
import { VerifyRegistrationDto } from './dto/verify-registration.dto.js';
import { FinishRegistrationDto } from './dto/finish-registration.dto.js';

import {
    randomBytes,
    createHash,
} from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';

import { LoginChallenge } from './login-challenge.entity.js';
import { SmsVerificationService } from './sms-verification.service.js';


import { MailService } from '../mail/mail.service.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RegistrationSession)
    private readonly registrationSessionRepository: Repository<RegistrationSession>,


    @InjectRepository(LoginChallenge)
    private readonly loginChallengeRepository: Repository<LoginChallenge>,

    private readonly smsService: SmsVerificationService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService, 

    private readonly mailService: MailService,
  ) {}
  private async verifyGoogleCredential(credential: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
        throw new ServiceUnavailableException(
            'Google authentication is not configured',
        );
    }

    try {
        const client = new OAuth2Client(clientId);

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: clientId,
        });

        const payload = ticket.getPayload();

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
    } catch {
        throw new UnauthorizedException(
            'Invalid Google credential',
        );
    }
}

async linkGoogleAccount(
    userId: number,
    credential: string,
) {
    const identity = await this.verifyGoogleCredential(credential);

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
    if (user.sms2faEnabled) {
        return this.createLoginChallenge(user);
    }

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

  async loginWithGoogle(credential: string) {
    const identity = await this.verifyGoogleCredential(credential);

    const user = await this.userRepository.findOne({
        where: {
            googleId: identity.googleId,
        },
    });

    if (!user) {
        throw new UnauthorizedException(
            'This Google account is not connected to an iRent account',
        );
    }
    
    return this.prepareLogin(user);
}

async unlinkGoogleAccount(
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

    user.googleId = null;
    user.googleEmail = null;

    await this.userRepository.save(user);

    return {
        message: 'Google account disconnected',
    };
}
async startPhoneVerification(
    userId: number,
    phoneNumber: string,
) {
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
}