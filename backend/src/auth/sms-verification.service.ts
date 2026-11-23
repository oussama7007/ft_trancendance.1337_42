
import {
    Injectable,
    ServiceUnavailableException,
} from '@nestjs/common';

/**
 * SMS verification service — provider not yet selected.
 *
 * The business logic, controller routes, DTOs, entities and database fields
 * for SMS 2FA are intentionally preserved here so they can be completed once
 * the owner chooses a provider (Twilio, TextBee, EnvoiSMS.ma, …).
 *
 * While SMS_2FA_ENABLED=false (the default), every method throws
 * ServiceUnavailableException without touching any external service.
 *
 * To enable later:
 *   1. Set SMS_2FA_ENABLED=true in backend/.env.
 *   2. Install the chosen provider's SDK.
 *   3. Replace the method bodies below with the real provider calls.
 *   4. Remove the "provider not yet integrated" comments.
 */
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