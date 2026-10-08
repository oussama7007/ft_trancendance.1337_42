import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomInt } from 'node:crypto';
import { RegistrationSession } from './registration-session-entity.js';
import { StartRegistrationDto } from './dto/start-registration.dto.js';
import { RequestVerificationDto } from './dto/request-verification.dto.js';


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RegistrationSession)
    private readonly registrationSessionRepository: Repository<RegistrationSession>,
  ) {}

  async startRegistration(data: StartRegistrationDto) {
    const session = this.registrationSessionRepository.create(data);

    return await this.registrationSessionRepository.save(session);
  }

  private getContactType(contact: string)
  {
    if (contact.includes('@'))
      return 'email';

    if (/^\+?[0-9\s]{8,20}$/.test(contact))
      return 'phone';

    return 'invalid';
  }

    async requestVerification(data: RequestVerificationDto)
    {
      const session = await this.registrationSessionRepository.findOne({
        where: { id: data.sessionId },
      });

      if (!session)
        throw new Error('Registration session not found');

      const contactType = this.getContactType(data.contact);

      if (contactType === 'invalid')
        throw new Error('Invalid email or phone number');

      const code = randomInt(100000, 1000000).toString();

      session.contact = data.contact;
      session.verificationCode = code;
      session.verificationCodeExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
      session.isVerified = false;

      await this.registrationSessionRepository.save(session);

      console.log(`[DEV] Verification code for ${data.contact}: ${code}`);

      return {
        sessionId: session.id,
        message: 'Verification code generated',
      };
    }
}