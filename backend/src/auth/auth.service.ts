import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RegistrationSession } from './registration-session-entity.js';
import { StartRegistrationDto } from './dto/start-registration.dto.js';

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
}