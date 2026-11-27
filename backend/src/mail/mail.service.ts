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

    async sendEmailChangeCompleted(
        oldEmail: string,
        newEmail: string,
    ) {
        const transporter = this.createTransporter();
        const changedAt = new Date().toISOString();

        await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: oldEmail,
            subject: 'Your iRent email address was changed',
            text: `Your iRent email address was successfully changed.\n\nOld email: ${oldEmail}\nNew email: ${newEmail}\nChanged at: ${changedAt}\n\nIf you did not make this change, contact iRent support immediately to secure your account.`,
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
            text: `A request was made to use this address for an iRent account.\n\nYour verification code is:\n\n${code}\n\nThis code expires in 5 minutes. If you did not expect this message, you can ignore it and contact iRent support.`,
        });
    }

    async sendPasswordResetCode(
        email: string,
        code: string,
    ) {
        const transporter = this.createTransporter();

        await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: email,
            subject: 'Reset your iRent password',
            text: `A request was made to reset your iRent account password.\n\nYour verification code is:\n\n${code}\n\nThis code expires in 5 minutes. If you did not request this, you can ignore this message and your password will remain unchanged.\n\nFor security reasons, never share this code with anyone.`,
        });
    }

    async sendPasswordResetCompleted(email: string) {
        const transporter = this.createTransporter();
        const changedAt = new Date().toISOString();

        await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: email,
            subject: 'Your iRent password was reset',
            text: `Your iRent account password was successfully reset.\n\nReset at: ${changedAt}\n\nIf you did not make this change, contact iRent support immediately to secure your account.`,
        });
    }
}