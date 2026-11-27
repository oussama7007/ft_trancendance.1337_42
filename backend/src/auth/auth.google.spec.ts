import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service.js';
import { TotpService } from './totp.service.js';
import { MailService } from '../mail/mail.service.js';
import { User } from './user.entity.js';
import { TotpEnrollment } from './totp-enrollment.entity.js';
import { TotpRecoveryCode } from './totp-recovery-code.entity.js';

describe('AuthService - Google Authentication', () => {
  let service: AuthService;
  let userRepository: Repository<User>;

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockTotpService = {
    decryptSecret: jest.fn(),
    verifyToken: jest.fn(),
    hashToken: jest.fn(),
  };

  const mockTotpEnrollmentRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockTotpRecoveryCodeRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockMailService = {
    sendVerificationCode: jest.fn(),
    sendPasswordResetCode: jest.fn(),
    sendEmailChangeCode: jest.fn(),
    sendEmailChangeCompleted: jest.fn(),
    sendPasswordResetCompleted: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(TotpEnrollment),
          useValue: mockTotpEnrollmentRepository,
        },
        {
          provide: getRepositoryToken(TotpRecoveryCode),
          useValue: mockTotpRecoveryCodeRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: TotpService,
          useValue: mockTotpService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
    userRepository = module.get(getRepositoryToken(User));
  });

  describe('verifyGoogleCredential', () => {
    const validPayload = {
      sub: 'google-sub-123',
      email: 'user@example.com',
      email_verified: true,
    };

    it('should return googleId and googleEmail for a valid ID token', async () => {
      const verifyIdToken = jest.fn().mockResolvedValue({
        getPayload: () => validPayload,
      });
      jest.spyOn(require('google-auth-library'), 'OAuth2Client').mockImplementation(() => ({
        verifyIdToken,
      } as any));

      process.env.GOOGLE_CLIENT_ID = 'test-client-id';

      const result = await (service as any).verifyGoogleCredential('valid-id-token');

      expect(verifyIdToken).toHaveBeenCalledWith({
        idToken: 'valid-id-token',
        audience: 'test-client-id',
      });
      expect(result).toEqual({
        googleId: 'google-sub-123',
        googleEmail: 'user@example.com',
      });
    });

    it('should throw UnauthorizedException for missing credential', async () => {
      await expect(
        (service as any).verifyGoogleCredential(undefined),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when sub is missing', async () => {
      const verifyIdToken = jest.fn().mockResolvedValue({
        getPayload: () => ({ email: 'user@example.com', email_verified: true }),
      });
      jest.spyOn(require('google-auth-library'), 'OAuth2Client').mockImplementation(() => ({
        verifyIdToken,
      } as any));

      process.env.GOOGLE_CLIENT_ID = 'test-client-id';

      await expect(
        (service as any).verifyGoogleCredential('invalid-id-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when email_verified is false', async () => {
      const verifyIdToken = jest.fn().mockResolvedValue({
        getPayload: () => ({ sub: 'sub-123', email: 'user@example.com', email_verified: false }),
      });
      jest.spyOn(require('google-auth-library'), 'OAuth2Client').mockImplementation(() => ({
        verifyIdToken,
      } as any));

      process.env.GOOGLE_CLIENT_ID = 'test-client-id';

      await expect(
        (service as any).verifyGoogleCredential('invalid-id-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ServiceUnavailableException when GOOGLE_CLIENT_ID is not set', async () => {
      const originalClientId = process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_ID;

      await expect(
        (service as any).verifyGoogleCredential('some-token'),
      ).rejects.toThrow(ServiceUnavailableException);

      process.env.GOOGLE_CLIENT_ID = originalClientId;
    });
  });

  describe('loginWithGoogle', () => {
    it('should reject login when Google account is not linked', async () => {
      jest.spyOn(service as any, 'verifyGoogleCredential').mockResolvedValue({
        googleId: 'google-sub-123',
        googleEmail: 'user@example.com',
      });
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.loginWithGoogle('valid-id-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should not auto-link accounts based on email match', async () => {
      jest.spyOn(service as any, 'verifyGoogleCredential').mockResolvedValue({
        googleId: 'google-sub-123',
        googleEmail: 'existing@example.com',
      });

      // Search by googleId returns null
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.loginWithGoogle('valid-id-token')).rejects.toThrow(
        UnauthorizedException,
      );

      // Verify findOne was called only with googleId, not googleEmail
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { googleId: 'google-sub-123' },
      });
    });

    it('should login successfully when Google account is linked', async () => {
      const user = {
        id: 1,
        googleId: 'google-sub-123',
        googleEmail: 'user@example.com',
        email: 'user@example.com',
        totpEnabled: false,
        totpSecretEncrypted: null,
        firstName: 'John',
        lastName: 'Doe',
      } as any;

      jest.spyOn(service as any, 'verifyGoogleCredential').mockResolvedValue({
        googleId: 'google-sub-123',
        googleEmail: 'user@example.com',
      });
      mockUserRepository.findOne.mockResolvedValue(user);
      mockJwtService.signAsync.mockResolvedValue('jwt-token');

      const result = await service.loginWithGoogle('valid-id-token');

      expect(result.accessToken).toBe('jwt-token');
      expect(result.requiresTwoFactor).toBe(false);
    });

    it('should create TOTP challenge when TOTP is enabled', async () => {
      const user = {
        id: 1,
        googleId: 'google-sub-123',
        totpEnabled: true,
        totpSecretEncrypted: 'encrypted-secret',
      } as any;

      jest.spyOn(service as any, 'verifyGoogleCredential').mockResolvedValue({
        googleId: 'google-sub-123',
        googleEmail: 'user@example.com',
      });
      mockUserRepository.findOne.mockResolvedValue(user);
      jest.spyOn(service as any, 'createTotpLoginChallenge').mockResolvedValue({
        requiresTwoFactor: true,
        challengeToken: 'challenge-token',
      });

      const result = await service.loginWithGoogle('valid-id-token');

      expect(result.requiresTwoFactor).toBe(true);
      expect(result.challengeToken).toBe('challenge-token');
    });
  });

  describe('linkGoogleAccount', () => {
    it('should require current password for password-based accounts', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 1,
        passwordHash: 'hashed-password',
        totpEnabled: false,
      } as any);

      jest.spyOn(service as any, 'verifyGoogleCredential').mockResolvedValue({
        googleId: 'google-sub-123',
        googleEmail: 'user@example.com',
      });

      await expect(
        service.linkGoogleAccount(1, 'credential', undefined, undefined),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject when current password is incorrect', async () => {
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      mockUserRepository.findOne.mockResolvedValue({
        id: 1,
        passwordHash: 'hashed-password',
        totpEnabled: false,
      } as any);

      jest.spyOn(service as any, 'verifyGoogleCredential').mockResolvedValue({
        googleId: 'google-sub-123',
        googleEmail: 'user@example.com',
      });

      await expect(
        service.linkGoogleAccount(1, 'credential', 'wrong-password', undefined),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject when TOTP code is invalid', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 1,
        passwordHash: 'hashed-password',
        totpEnabled: true,
        totpSecretEncrypted: 'encrypted-secret',
      } as any);

      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      jest.spyOn(service as any, 'verifyGoogleCredential').mockResolvedValue({
        googleId: 'google-sub-123',
        googleEmail: 'user@example.com',
      });

      await expect(
        service.linkGoogleAccount(1, 'credential', 'correct-password', 'bad-code'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject linking when Google account is already connected to another user', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 1,
        passwordHash: 'hashed-password',
        totpEnabled: false,
      } as any); // current user

      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 2,
        googleId: 'google-sub-123',
      } as any); // existing user with this Google account

      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      jest.spyOn(service as any, 'verifyGoogleCredential').mockResolvedValue({
        googleId: 'google-sub-123',
        googleEmail: 'user@example.com',
      });

      await expect(
        service.linkGoogleAccount(1, 'credential', 'correct-password', undefined),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully link Google account after reauthentication', async () => {
      const user = {
        id: 1,
        passwordHash: 'hashed-password',
        totpEnabled: false,
        googleId: null,
        googleEmail: null,
        save: jest.fn(),
      } as any;

      mockUserRepository.findOne.mockResolvedValue(user);

      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      jest.spyOn(service as any, 'verifyGoogleCredential').mockResolvedValue({
        googleId: 'google-sub-123',
        googleEmail: 'user@example.com',
      });

      await service.linkGoogleAccount(1, 'credential', 'correct-password', undefined);

      expect(user.googleId).toBe('google-sub-123');
      expect(user.googleEmail).toBe('user@example.com');
      expect(user.save).toHaveBeenCalled();
    });

    it('should reject linking when user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.linkGoogleAccount(999, 'credential', 'password', undefined),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
