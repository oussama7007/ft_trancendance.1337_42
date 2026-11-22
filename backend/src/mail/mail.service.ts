import {
    Injectable,
    ServiceUnavailableException,
} from '@nestjs/common';

import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private createTransporter() {
        const user = process.env.MAIL_USER;
        const password = process.env.MAIL_PASSWORD;

        if (!user || !password) {
            throw new ServiceUnavailableException(
                'Email service is not configured',
            );
        }

        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user,
                pass: password,
            },
        });
    }

    async sendVerificationCode(
        email: string,
        code: string,
    ) {
        const transporter = this.createTransporter();

        await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: email,
            subject: 'Verify your iRent email address',
            text: `Your verification code is ${code}.

This code expires in 5 minutes.`,
        });
    }

    async sendEmailChangeCode(
        email: string,
        code: string,
    ) {
        const transporter = this.createTransporter();

        await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: email,
            subject: 'Verify your new iRent email address',
            text: `Your iRent email change verification code is:

${code}

This code expires in 5 minutes.

If you did not request this change, you can ignore this email.`,
        });
    }
}