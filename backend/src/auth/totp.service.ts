import {
    Injectable,
    Logger,
} from '@nestjs/common';
import * as crypto from 'node:crypto';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

const TOTP_INTERVAL = 30; // seconds
const TOTP_DIGITS = 6;
const TOTP_ALGORITHM = 'sha1';
const TOTP_WINDOW = 1; // allow ±1 time step for clock drift

function getEncryptionKey(): Buffer {
    const keyHex = process.env.TOTP_ENCRYPTION_KEY;
    if (!keyHex) {
        throw new Error('TOTP_ENCRYPTION_KEY environment variable is not set');
    }
    const key = Buffer.from(keyHex, 'hex');
    if (key.length !== 32) {
        throw new Error('TOTP_ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
    }
    return key;
}

function encrypt(text: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(encryptedData: string): string {
    const key = getEncryptionKey();
    const buffer = Buffer.from(encryptedData, 'base64');
    const iv = buffer.subarray(0, IV_LENGTH);
    const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = buffer.subarray(IV_LENGTH + TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);
    return decrypted.toString('utf8');
}

function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a base32-encoded random secret (RFC 4648 base32).
 */
function generateBase32Secret(length = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const bytes = crypto.randomBytes(length);
    let result = '';
    let buffer = 0;
    let bitsLeft = 0;
    for (const byte of bytes) {
        buffer = (buffer << 8) | byte;
        bitsLeft += 8;
        while (bitsLeft >= 5) {
            result += chars[(buffer >> (bitsLeft - 5)) & 31];
            bitsLeft -= 5;
        }
    }
    return result;
}

/**
 * Decode a base32-encoded string (RFC 4648) into a byte array.
 */
function decodeBase32(secret: string): Uint8Array {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const clean = secret.replace(/=+$/, '').toUpperCase();
    let buffer = 0;
    let bitsLeft = 0;
    const bytes: number[] = [];
    for (const char of clean) {
        const val = chars.indexOf(char);
        if (val === -1) {
            throw new Error(`Invalid base32 character: ${char}`);
        }
        buffer = (buffer << 5) | val;
        bitsLeft += 5;
        if (bitsLeft >= 8) {
            bytes.push((buffer >> (bitsLeft - 8)) & 0xff);
            bitsLeft -= 8;
            buffer &= (1 << bitsLeft) - 1; // keep only remaining bits
        }
    }
    return new Uint8Array(bytes);
}

/**
 * Compute the TOTP code for a given secret and time counter (RFC 6238).
 */
function computeTotp(secret: string, counter: number): string {
    const key = decodeBase32(secret);
    const keyBuffer = Buffer.from(key);
    const counterBuffer = Buffer.alloc(8);
    for (let i = 7; i >= 0; i--) {
        counterBuffer[i] = counter & 0xff;
        counter = Math.floor(counter / 256);
    }
    const hmac = crypto.createHmac(TOTP_ALGORITHM, keyBuffer);
    hmac.update(counterBuffer);
    const hash = hmac.digest();

    // Dynamic truncation (RFC 4226)
    const offset = hash[hash.length - 1] & 0x0f;
    const binary =
        ((hash[offset] & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) << 8) |
        (hash[offset + 3] & 0xff);

    const otp = binary % 10 ** TOTP_DIGITS;
    return otp.toString().padStart(TOTP_DIGITS, '0');
}

function getCurrentTimeStep(): number {
    return Math.floor(Date.now() / 1000 / TOTP_INTERVAL);
}

@Injectable()
export class TotpService {
    private readonly logger = new Logger(TotpService.name);
    private readonly issuer = 'iRent';

    generateSecret(): string {
        return generateBase32Secret();
    }

    generateProvisioningUri(email: string, secret: string): string {
        const encodedEmail = encodeURIComponent(email);
        return `otpauth://totp/${this.issuer}:${encodedEmail}?secret=${secret}&issuer=${encodeURIComponent(this.issuer)}`;
    }

    verifyToken(secret: string, token: string): boolean {
        try {
            const currentStep = getCurrentTimeStep();
            // Accept current step and ±window steps for clock drift
            for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
                const expected = computeTotp(secret, currentStep + i);
                if (expected === token) {
                    return true;
                }
            }
            return false;
        } catch {
            return false;
        }
    }

    encryptSecret(secret: string): string {
        return encrypt(secret);
    }

    decryptSecret(encrypted: string): string {
        return decrypt(encrypted);
    }

    hashToken(token: string): string {
        return hashToken(token);
    }

    generateRecoveryCodes(count = 8): string[] {
        const codes: string[] = [];
        for (let i = 0; i < count; i++) {
            codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
        }
        return codes;
    }

    validateEncryptionKey(): void {
        try {
            getEncryptionKey();
        } catch (error) {
            this.logger.error(
                'TOTP_ENCRYPTION_KEY is not configured correctly. ' +
                'Set it to a 64-character hex string (32 bytes).',
            );
            throw error;
        }
    }
}
