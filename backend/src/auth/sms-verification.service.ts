
import {
    Injectable,
    ServiceUnavailableException,
} from '@nestjs/common';

@Injectable()
export class SmsVerificationService {
    private get isEnabled(): boolean {
        return process.env.SMS_2FA_ENABLED === 'true';
    }

    private assertEnabled(): void {
        if (!this.isEnabled) {
            throw new ServiceUnavailableException(
                'SMS two-factor authentication is temporarily unavailable',
            );
        }
    }

    // TODO [SMS PROVIDER]: replace with real provider call.
    async sendVerificationCode(_phoneNumber: string): Promise<void> {
        this.assertEnabled();
        // Provider-specific implementation goes here.
    }

    // TODO [SMS PROVIDER]: replace with real provider call.
    async verifyCode(
        _phoneNumber: string,
        _code: string,
    ): Promise<boolean> {
        this.assertEnabled();
        // Provider-specific implementation goes here.
        return false;
    }
}