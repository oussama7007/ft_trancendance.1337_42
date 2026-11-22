
/*


import {
    Injectable,
    ServiceUnavailableException,
} from '@nestjs/common';

import { randomInt } from 'node:crypto';

@Injectable()
export class SmsVerificationService {
    private getConfiguration() {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

        if (!accountSid || !authToken || !serviceSid) {
            throw new ServiceUnavailableException(
                'SMS verification is not configured',
            );
        }

        return {
            client: twilio(accountSid, authToken),
            serviceSid,
        };
    }

    async sendVerificationCode(phoneNumber: string) {
        const { client, serviceSid } = this.getConfiguration();

        return client.verify.v2
            .services(serviceSid)
            .verifications.create({
                to: phoneNumber,
                channel: 'sms',
            });
    }

    async verifyCode(
        phoneNumber: string,
        code: string,
    ): Promise<boolean> {
        const { client, serviceSid } = this.getConfiguration();

        const result = await client.verify.v2
            .services(serviceSid)
            .verificationChecks.create({
                to: phoneNumber,
                code,
            });

        return result.status === 'approved';
    }
}
*/