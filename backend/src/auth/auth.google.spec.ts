import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException, NotFoundException, ServiceUnavailableException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service.js';
import { TotpService } from './totp.service.js';
import { MailService } from '../mail/mail.service.js';
import { User } from './user.entity.js';
import { TotpEnrollment } from './totp-enrollment.entity.js';
import { TotpLoginChallenge } from './totp-login-challenge.entity.js';
import { TotpRecoveryCode } from './totp-recovery-code.entity.js';
import { RegistrationSession } from './registration-session-entity.js';
import { EmailChangeChallenge } from './email-change-challenge.entity.js';
import { PasswordResetToken } from './password-reset-challenge.entity.js';
import { createHash } from 'node:crypto';
import * as bcrypt from 'bcrypt';

vi.mock('bcrypt', () => ({ compare: vi.fn(), hash: vi.fn() }));

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

const mockUserRepository = {
    findOne: vi.fn(),
    save: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
};

const mockTotpEnrollmentRepository = {
    findOne: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
};

const mockTotpLoginChallengeRepository = {
    findOne: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
};

const mockTotpRecoveryCodeRepository = {
    findOne: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
};

const mockRegistrationSessionRepository = {
    findOne: vi.fn(),
    save: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
};

const mockEmailChangeChallengeRepository = {
    findOne: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
};

const mockPasswordResetTokenRepository = {
    findOne: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(),
};

const mockJwtService = {
    signAsync: vi.fn(),
    verifyAsync: vi.fn(),
};

const mockMailService = {
    sendVerificationCode: vi.fn(),
    sendPasswordResetCode: vi.fn(),
    sendEmailChangeCode: vi.fn(),
    sendEmailChangeCompleted: vi.fn(),
    sendPasswordResetCompleted: vi.fn(),
};

const mockTotpService = {
    generateSecret: vi.fn(),
    generateProvisioningUri: vi.fn(),
    verifyToken: vi.fn(),
    encryptSecret: vi.fn(),
    decryptSecret: vi.fn(),
    hashToken: vi.fn(),
    generateRecoveryCodes: vi.fn(),
    validateEncryptionKey: vi.fn(),
};

describe('AuthService - Authentication Security', () => {
    let service: AuthService;

    beforeEach(async () => {
        vi.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: getRepositoryToken(User), useValue: mockUserRepository },
                { provide: getRepositoryToken(TotpEnrollment), useValue: mockTotpEnrollmentRepository },
                { provide: getRepositoryToken(TotpLoginChallenge), useValue: mockTotpLoginChallengeRepository },
                { provide: getRepositoryToken(TotpRecoveryCode), useValue: mockTotpRecoveryCodeRepository },
                { provide: getRepositoryToken(RegistrationSession), useValue: mockRegistrationSessionRepository },
                { provide: getRepositoryToken(EmailChangeChallenge), useValue: mockEmailChangeChallengeRepository },
                { provide: getRepositoryToken(PasswordResetToken), useValue: mockPasswordResetTokenRepository },
                { provide: JwtService, useValue: mockJwtService },
                { provide: TotpService, useValue: mockTotpService },
                { provide: MailService, useValue: mockMailService },
            ],
        }).compile();

        service = module.get(AuthService);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('validateCredentials - Email/Password Login', () => {
        it('should login successfully when TOTP is disabled', async () => {
            const user = {
                id: 1,
                email: 'user@example.com',
                passwordHash: 'hashed-password',
                totpEnabled: false,
                sessionVersion: 0,
            } as any;

            vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
            mockUserRepository.findOne.mockResolvedValue(user);
            mockJwtService.signAsync.mockResolvedValue('jwt-token');

            const result = await service.validateCredentials({ email: 'user@example.com', password: 'password123' });

            expect('accessToken' in result).toBe(true);
            if ('accessToken' in result) {
                expect(result.accessToken).toBe('jwt-token');
            }
            expect(result.requiresTwoFactor).toBe(false);
        });

        it('should create TOTP challenge when TOTP is enabled', async () => {
            const user = {
                id: 1,
                email: 'user@example.com',
                passwordHash: 'hashed',
                totpEnabled: true,
                totpSecretEncrypted: 'encrypted',
            } as any;

            mockUserRepository.findOne.mockResolvedValue(user);
            vi.spyOn(service as any, 'createTotpLoginChallenge').mockResolvedValue({
                requiresTwoFactor: true,
                challengeToken: 'challenge-token',
            });

            const result = await service.validateCredentials({ email: 'user@example.com', password: 'password123' });

            expect('challengeToken' in result).toBe(true);
            if ('challengeToken' in result) {
                expect(result.challengeToken).toBe('challenge-token');
            }
            expect(result.requiresTwoFactor).toBe(true);
        });

        it('should reject invalid password', async () => {
            mockUserRepository.findOne.mockResolvedValue({
                id: 1,
                passwordHash: 'hashed',
                totpEnabled: false,
            } as any);

            vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

            await expect(service.validateCredentials({ email: 'user@example.com', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('loginWithGoogle - Google Authentication', () => {
        it('should login successfully when Google account is linked and TOTP disabled', async () => {
            const user = {
                id: 1,
                googleId: 'google-sub-123',
                totpEnabled: false,
            } as any;

            vi.spyOn(service as any, 'verifyGoogleCredential').mockResolvedValue({
                googleId: 'google-sub-123',
                googleEmail: 'user@example.com',
            });
            mockUserRepository.findOne.mockResolvedValue(user);
            mockJwtService.signAsync.mockResolvedValue('jwt-token');

            const result = await service.loginWithGoogle('valid-id-token');

            expect('accessToken' in result).toBe(true);
            if ('accessToken' in result) {
                expect(result.accessToken).toBe('jwt-token');
            }
            expect(result.requiresTwoFactor).toBe(false);
        });

        it('should create TOTP challenge when Google account is linked and TOTP enabled', async () => {
            const user = {
                id: 1,
                googleId: 'google-sub-123',
                totpEnabled: true,
            } as any;

            vi.spyOn(service as any, 'verifyGoogleCredential').mockResolvedValue({
                googleId: 'google-sub-123',
                googleEmail: 'user@example.com',
            });
            mockUserRepository.findOne.mockResolvedValue(user);
            vi.spyOn(service as any, 'createTotpLoginChallenge').mockResolvedValue({
                requiresTwoFactor: true,
                challengeToken: 'challenge-token',
            });

            const result = await service.loginWithGoogle('valid-id-token');

            expect('challengeToken' in result).toBe(true);
            if ('challengeToken' in result) {
                expect(result.challengeToken).toBe('challenge-token');
            }
            expect(result.requiresTwoFactor).toBe(true);
        });

        it('should reject with GOOGLE_ACCOUNT_NOT_LINKED when the email exists but Google is not linked', async () => {
            vi.spyOn(service as any, 'verifyGoogleCredential').mockResolvedValue({
                googleId: 'google-sub-123',
                googleEmail: 'User@Example.com',
            });
            mockUserRepository.findOne
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ id: 1, email: 'user@example.com', googleId: null });

            await expect(service.loginWithGoogle('valid-id-token')).rejects.toMatchObject({
                response: { code: 'GOOGLE_ACCOUNT_NOT_LINKED' },
            });
            expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(2, {
                where: { email: 'user@example.com' },
            });
        });

        it('should reject with GOOGLE_ACCOUNT_NOT_REGISTERED when no iRent account has this email', async () => {
            vi.spyOn(service as any, 'verifyGoogleCredential').mockResolvedValue({
                googleId: 'google-sub-123',
                googleEmail: 'new@example.com',
            });
            mockUserRepository.findOne.mockResolvedValue(null);

            await expect(service.loginWithGoogle('valid-id-token')).rejects.toMatchObject({
                response: { code: 'GOOGLE_ACCOUNT_NOT_REGISTERED' },
            });
        });

        it('should NOT auto-link accounts based on email match', async () => {
            vi.spyOn(service as any, 'verifyGoogleCredential').mockResolvedValue({
                googleId: 'google-sub-123',
                googleEmail: 'existing@example.com',
            });
            mockUserRepository.findOne.mockResolvedValue(null);

            await expect(service.loginWithGoogle('valid-id-token')).rejects.toThrow(
                UnauthorizedException,
            );

            // Verify findOne was called only with googleId, not googleEmail
            expect(mockUserRepository.findOne).toHaveBeenCalledWith({
                where: { googleId: 'google-sub-123' },
            });
        });
    });

    describe('linkGoogleAccount - Account Linking with Reauthentication', () => {
        it('should require current password for password-based accounts', async () => {
            mockUserRepository.findOne.mockResolvedValue({
                id: 1,
                passwordHash: 'hashed-password',
                totpEnabled: false,
            } as any);

            vi.spyOn(service as any, 'verifyGoogleCredential').mockResolvedValue({
                googleId: 'google-sub-123',
                googleEmail: 'user@example.com',
            });

            await expect(
                service.linkGoogleAccount(1, 'credential', undefined, undefined),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should reject when current password is incorrect', async () => {
            vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

            mockUserRepository.findOne.mockResolvedValue({
                id: 1,
                passwordHash: 'hashed-password',
                totpEnabled: false,
            } as any);

            vi.spyOn(service as any, 'verifyGoogleCredential').mockResolvedValue({
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

            vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
            vi.spyOn(service as any, 'verifyTotpCodeForReauth').mockResolvedValue(false);
            vi.spyOn(service as any, 'verifyGoogleCredential').mockResolvedValue({
                googleId: 'google-sub-123',
                googleEmail: 'user@example.com',
            });

            await expect(
                service.linkGoogleAccount(1, 'credential', 'correct-password', 'bad-code'),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should reject linking when Google account already connected to another user', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce({
                id: 1,
                passwordHash: 'hashed-password',
                totpEnabled: false,
            } as any);
            mockUserRepository.findOne.mockResolvedValueOnce({
                id: 2,
                googleId: 'google-sub-123',
            } as any);

            vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
            vi.spyOn(service as any, 'verifyGoogleCredential').mockResolvedValue({
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
                save: vi.fn(),
            } as any;

            mockUserRepository.findOne.mockResolvedValue(user);

            vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
            vi.spyOn(service as any, 'verifyGoogleCredential').mockResolvedValue({
                googleId: 'google-sub-123',
                googleEmail: 'user@example.com',
            });

            await service.linkGoogleAccount(1, 'credential', 'correct-password', undefined);

            expect(user.googleId).toBe('google-sub-123');
            expect(user.googleEmail).toBe('user@example.com');
            expect(mockUserRepository.save).toHaveBeenCalledWith(user);
        });
    });

    describe('verifyTotpLogin - TOTP Login Verification', () => {
        it('should successfully verify TOTP code and issue session', async () => {
            const challenge = {
                id: 1,
                userId: 1,
                tokenHash: 'hash',
                expiresAt: new Date(Date.now() + 300000),
                attempts: 0,
            } as any;

            const user = {
                id: 1,
                googleId: null,
                googleEmail: null,
                totpEnabled: true,
                totpSecretEncrypted: 'encrypted',
                totpLastUsedStep: null,
                sessionVersion: 0,
            } as any;

            vi.spyOn(service as any, 'verifyGoogleCredential').mockResolvedValue({
                googleId: 'sub',
                googleEmail: 'user@example.com',
            });
            mockTotpLoginChallengeRepository.findOne.mockResolvedValue(challenge);
            mockUserRepository.findOne.mockResolvedValue(user);
            mockTotpService.decryptSecret.mockReturnValue('secret');
            mockTotpService.verifyToken.mockReturnValue(true);
            mockJwtService.signAsync.mockResolvedValue('jwt-token');

            const result = await service.verifyTotpLogin('challenge-token', '123456');

            expect(result.accessToken).toBe('jwt-token');
            expect(mockTotpLoginChallengeRepository.delete).toHaveBeenCalledWith({ id: 1 });
        });

        it('should reject expired login challenge', async () => {
            const challenge = {
                id: 1,
                userId: 1,
                tokenHash: 'hash',
                expiresAt: new Date(Date.now() - 300000),
                attempts: 0,
            } as any;

            mockTotpLoginChallengeRepository.findOne.mockResolvedValue(challenge);

            await expect(
                service.verifyTotpLogin('challenge-token', '123456'),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should reject too many attempts', async () => {
            const challenge = {
                id: 1,
                userId: 1,
                tokenHash: 'hash',
                expiresAt: new Date(Date.now() + 300000),
                attempts: 5,
            } as any;

            mockTotpLoginChallengeRepository.findOne.mockResolvedValue(challenge);

            await expect(
                service.verifyTotpLogin('challenge-token', '123456'),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should reject replay of same TOTP time step', async () => {
            const challenge = {
                id: 1,
                userId: 1,
                tokenHash: 'hash',
                expiresAt: new Date(Date.now() + 300000),
                attempts: 0,
            } as any;

            const user = {
                id: 1,
                totpEnabled: true,
                totpSecretEncrypted: 'encrypted',
                totpLastUsedStep: Math.floor(Date.now() / 1000 / 30).toString(),
            } as any;

            mockTotpLoginChallengeRepository.findOne.mockResolvedValue(challenge);
            mockUserRepository.findOne.mockResolvedValue(user);
            mockTotpService.decryptSecret.mockReturnValue('secret');
            mockTotpService.verifyToken.mockReturnValue(true);

            await expect(
                service.verifyTotpLogin('challenge-token', '123456'),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should accept valid recovery code', async () => {
            const challenge = {
                id: 1,
                userId: 1,
                tokenHash: 'hash',
                expiresAt: new Date(Date.now() + 300000),
                attempts: 0,
            } as any;

            const user = {
                id: 1,
                totpEnabled: true,
                totpSecretEncrypted: 'encrypted',
                totpLastUsedStep: null,
            } as any;

            // Any of the 8 codes must work, not only the first unused one.
            const thirdCode = 'C3C3C3C3C3C3C3C3C3C3C3C3C3C3C3C3';

            mockTotpLoginChallengeRepository.findOne.mockResolvedValue(challenge);
            mockUserRepository.findOne.mockResolvedValue(user);
            mockTotpService.decryptSecret.mockReturnValue('secret');
            mockTotpService.verifyToken.mockReturnValue(false); // TOTP code invalid
            mockTotpService.hashToken.mockImplementation(sha256);
            mockTotpRecoveryCodeRepository.update.mockResolvedValue({ affected: 1 });
            mockJwtService.signAsync.mockResolvedValue('jwt-token');

            // Lower case and spaces are accepted, like a user typing it.
            const result = await service.verifyTotpLogin('challenge-token', ' c3c3c3c3 c3c3c3c3c3c3c3c3c3c3c3c3 ');

            expect(result.accessToken).toBe('jwt-token');
            expect(mockTotpRecoveryCodeRepository.update).toHaveBeenCalledWith(
                { userId: 1, codeHash: sha256(thirdCode), used: false },
                expect.objectContaining({ used: true }),
            );
        });

        it('should reject an already used recovery code', async () => {
            mockTotpLoginChallengeRepository.findOne.mockResolvedValue({
                id: 1,
                userId: 1,
                expiresAt: new Date(Date.now() + 300000),
                attempts: 0,
            });
            mockUserRepository.findOne.mockResolvedValue({
                id: 1,
                totpEnabled: true,
                totpSecretEncrypted: 'encrypted',
                totpLastUsedStep: null,
            });
            mockTotpService.decryptSecret.mockReturnValue('secret');
            mockTotpService.verifyToken.mockReturnValue(false);
            mockTotpService.hashToken.mockImplementation(sha256);
            // The conditional UPDATE matches nothing: code missing or already used.
            mockTotpRecoveryCodeRepository.update.mockResolvedValue({ affected: 0 });

            await expect(
                service.verifyTotpLogin('challenge-token', 'C3C3C3C3C3C3C3C3C3C3C3C3C3C3C3C3'),
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('Password Reset Security', () => {
        it('should verify code and return a raw grant whose hash is stored', async () => {
            const user = { id: 1, email: 'user@example.com' } as any;
            const challenge = {
                id: 1,
                userId: 1,
                tokenHash: sha256('1:123456'),
                used: false,
                attempts: 0,
                expiresAt: new Date(Date.now() + 300000),
            } as any;

            mockUserRepository.findOne.mockResolvedValue(user);
            mockPasswordResetTokenRepository.findOne.mockResolvedValue(challenge);
            mockTotpService.hashToken.mockImplementation(sha256);

            const result = await service.verifyPasswordReset({ email: 'user@example.com', code: '123456' });

            expect(challenge.used).toBe(true);
            expect(result.grantToken).toMatch(/^[0-9a-f]{64}$/);
            // The database keeps only the hash, never the grant itself.
            expect(challenge.grantHash).toBe(sha256(result.grantToken));
            expect(challenge.grantHash).not.toBe(result.grantToken);
        });

        it('should count a wrong code as a failed attempt', async () => {
            const challenge = {
                id: 1,
                userId: 1,
                tokenHash: sha256('1:123456'),
                used: false,
                attempts: 0,
                expiresAt: new Date(Date.now() + 300000),
            } as any;

            mockUserRepository.findOne.mockResolvedValue({ id: 1 });
            mockPasswordResetTokenRepository.findOne.mockResolvedValue(challenge);

            await expect(
                service.verifyPasswordReset({ email: 'user@example.com', code: '000000' }),
            ).rejects.toThrow(BadRequestException);
            expect(challenge.attempts).toBe(1);
            expect(challenge.used).toBe(false);
        });

        it('should reset password with the grant returned by verify', async () => {
            const user = {
                id: 1,
                email: 'user@example.com',
                passwordHash: 'old-hash',
                sessionVersion: 0,
            } as any;
            const challenge = {
                id: 1,
                userId: 1,
                tokenHash: sha256('1:123456'),
                used: false,
                attempts: 0,
                expiresAt: new Date(Date.now() + 300000),
            } as any;

            mockUserRepository.findOne.mockResolvedValue(user);
            mockPasswordResetTokenRepository.findOne.mockResolvedValue(challenge);
            mockTotpService.hashToken.mockImplementation(sha256);
            vi.mocked(bcrypt.hash).mockResolvedValue('new-hash' as never);

            const { grantToken } = await service.verifyPasswordReset({ email: 'user@example.com', code: '123456' });

            await service.resetPassword({
                email: 'user@example.com',
                newPassword: 'NewPassword123!',
                grantToken,
            });

            expect(user.passwordHash).toBe('new-hash');
            expect(user.sessionVersion).toBe(1);
            expect(mockPasswordResetTokenRepository.delete).toHaveBeenCalledWith(1);
        });

        it('should reject reset with a wrong grant token', async () => {
            const challenge = {
                id: 1,
                userId: 1,
                grantHash: sha256('a'.repeat(64)),
                used: true,
                expiresAt: new Date(Date.now() + 300000),
            } as any;

            mockUserRepository.findOne.mockResolvedValue({ id: 1, email: 'user@example.com' });
            mockPasswordResetTokenRepository.findOne.mockResolvedValue(challenge);
            mockTotpService.hashToken.mockImplementation(sha256);

            await expect(
                service.resetPassword({
                    email: 'user@example.com',
                    newPassword: 'NewPassword123!',
                    grantToken: 'b'.repeat(64),
                }),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('Registration Security', () => {
        it('should return a random UUID as the session id, not the numeric row id', async () => {
            mockRegistrationSessionRepository.create.mockImplementation((data) => ({ id: 7, ...data }));
            mockRegistrationSessionRepository.save.mockImplementation(async (session) => session);

            const result = await service.startRegistration({
                firstName: 'Sara',
                lastName: 'Amrani',
                dateOfBirth: '1990-01-01',
                gender: 'female',
            });

            expect(result.sessionId).toMatch(/^[0-9a-f-]{36}$/);
            expect(result.sessionId).not.toBe(7);
        });

        it('should store the verification code hashed and limit wrong attempts', async () => {
            const session = {
                id: 7,
                token: '6f1c2b1e-8d4a-4a8b-9c1d-2e3f4a5b6c7d',
                verificationCode: null,
                verificationCodeExpiresAt: null,
                verificationAttempts: 0,
                isVerified: false,
            } as any;

            mockRegistrationSessionRepository.findOne.mockResolvedValue(session);
            mockRegistrationSessionRepository.save.mockImplementation(async (s) => s);
            mockUserRepository.findOne.mockResolvedValue(null);

            await service.requestVerification({ sessionId: session.token, email: 'new@example.com' });

            const sentCode = mockMailService.sendVerificationCode.mock.calls[0][1] as string;
            expect(session.verificationCode).not.toBe(sentCode);
            expect(session.verificationCode).toMatch(/^[0-9a-f]{64}$/);

            const wrongCode = sentCode === '000000' ? '111111' : '000000';
            for (let i = 0; i < 4; i++) {
                await expect(
                    service.verifyRegistration({ sessionId: session.token, code: wrongCode }),
                ).rejects.toThrow('Invalid verification code');
            }
            // 5th wrong attempt: the code is cancelled.
            await expect(
                service.verifyRegistration({ sessionId: session.token, code: wrongCode }),
            ).rejects.toThrow('Too many incorrect attempts');
            expect(session.verificationCode).toBeNull();

            // Even the right code no longer works; a new code must be requested.
            await expect(
                service.verifyRegistration({ sessionId: session.token, code: sentCode }),
            ).rejects.toThrow('Request a verification code first');
        });

        it('should verify the right code', async () => {
            const session = {
                id: 7,
                token: '6f1c2b1e-8d4a-4a8b-9c1d-2e3f4a5b6c7d',
                verificationAttempts: 0,
                isVerified: false,
            } as any;

            mockRegistrationSessionRepository.findOne.mockResolvedValue(session);
            mockRegistrationSessionRepository.save.mockImplementation(async (s) => s);
            mockUserRepository.findOne.mockResolvedValue(null);

            await service.requestVerification({ sessionId: session.token, email: 'new@example.com' });
            const sentCode = mockMailService.sendVerificationCode.mock.calls[0][1] as string;

            const result = await service.verifyRegistration({ sessionId: session.token, code: sentCode });

            expect(session.isVerified).toBe(true);
            expect(result.sessionId).toBe(session.token);
        });
    });
});
