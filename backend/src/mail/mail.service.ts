import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  async sendVerificationCode(email: string, code: string) {

    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });


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