// import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { randomInt } from 'node:crypto';
// import { RegistrationSession } from './registration-session-entity.js';
// import { StartRegistrationDto } from './dto/start-registration.dto.js';
// import { RequestVerificationDto } from './dto/request-verification.dto.js';


// @Injectable()
// export class AuthService {
//   constructor(
//     @InjectRepository(RegistrationSession)
//     private readonly registrationSessionRepository: Repository<RegistrationSession>,
//   ) {}

//   async startRegistration(data: StartRegistrationDto) {
//     const session = this.registrationSessionRepository.create(data);

//     return await this.registrationSessionRepository.save(session);
//   }

//   private getContactType(contact: string)
//   {
//     if (contact.includes('@'))
//       return 'email';

//     if (/^\+?[0-9\s]{8,20}$/.test(contact))
//       return 'phone';

//     return 'invalid';
//   }

//     async requestVerification(data: RequestVerificationDto)
//     {
//       const session = await this.registrationSessionRepository.findOne({
//         where: { id: data.sessionId },
//       });

//       if (!session)
//         throw new Error('Registration session not found');

//       const contactType = this.getContactType(data.contact);

//       if (contactType === 'invalid')
//         throw new Error('Invalid email or phone number');

//       const code = randomInt(100000, 1000000).toString();

//       session.contact = data.contact;
//       session.verificationCode = code;
//       session.verificationCodeExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
//       session.isVerified = false;

//       await this.registrationSessionRepository.save(session);

//       console.log(`[DEV] Verification code for ${data.contact}: ${code}`);

//       return {
//         sessionId: session.id,
//         message: 'Verification code generated',
//       };
//     }
// }



import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,

} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomInt } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto.js';

import { RegistrationSession } from './registration-session-entity.js';
import { User } from './user.entity.js';
import { StartRegistrationDto } from './dto/start-registration.dto.js';
import { RequestVerificationDto } from './dto/request-verification.dto.js';
import { VerifyRegistrationDto } from './dto/verify-registration.dto.js';
import { FinishRegistrationDto } from './dto/finish-registration.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RegistrationSession)
    private readonly registrationSessionRepository: Repository<RegistrationSession>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // STEP 1: Save personal information temporarily.
  async startRegistration(data: StartRegistrationDto) {
    const session = this.registrationSessionRepository.create(data);

    const savedSession =
      await this.registrationSessionRepository.save(session);

    return {
      sessionId: savedSession.id,
      message: 'Registration started',
    };
  }

  private getContactType(contact: string) {
    if (contact.includes('@'))
      return 'email';

    if (/^\+?[0-9\s]{8,20}$/.test(contact))
      return 'phone';

    return 'invalid';
  }

  // STEP 2: Save the contact and generate a verification code.
  async requestVerification(data: RequestVerificationDto) {
    const session = await this.registrationSessionRepository.findOne({
      where: { id: data.sessionId },
    });

    if (!session)
      throw new NotFoundException('Registration session not found');

    const contact = data.contact.trim();
    const contactType = this.getContactType(contact);

    if (contactType === 'invalid')
      throw new BadRequestException('Invalid email or phone number');

    const existingUser = await this.userRepository.findOne({
      where: { contact },
    });

    if (existingUser)
      throw new ConflictException('This contact is already registered');

    const code = randomInt(0, 1000000).toString().padStart(6, '0');

    session.contact = contact;
    session.verificationCode = code;
    session.verificationCodeExpiresAt =
      new Date(Date.now() + 5 * 60 * 1000);
    session.isVerified = false;

    await this.registrationSessionRepository.save(session);

    // Development only: replace with real email/SMS delivery later.
    console.log(`[DEV] Verification code for ${contact}: ${code}`);

    return {
      sessionId: session.id,
      message: 'Verification code generated',
    };
  }

  // STEP 2 continued: Verify the code submitted by the user.
  async verifyRegistration(data: VerifyRegistrationDto) {
    const session = await this.registrationSessionRepository.findOne({
      where: { id: data.sessionId },
    });

    if (!session)
      throw new NotFoundException('Registration session not found');

    if (!session.verificationCode || !session.verificationCodeExpiresAt)
      throw new BadRequestException('Request a verification code first');

    if (session.verificationCodeExpiresAt.getTime() < Date.now())
      throw new BadRequestException('Verification code has expired');

    if (session.verificationCode !== data.code)
      throw new BadRequestException('Invalid verification code');

    session.isVerified = true;
    session.verificationCode = undefined;
    session.verificationCodeExpiresAt = undefined;

    await this.registrationSessionRepository.save(session);

    return {
      sessionId: session.id,
      message: 'Contact verified successfully',
    };
  }

  // STEP 3: Create the permanent user.
  async finishRegistration(data: FinishRegistrationDto) {
    const session = await this.registrationSessionRepository.findOne({
      where: { id: data.sessionId },
    });

    if (!session)
      throw new NotFoundException('Registration session not found');

    if (!session.isVerified || !session.contact)
      throw new BadRequestException('Verify your contact first');

    const existingUser = await this.userRepository.findOne({
      where: { contact: session.contact },
    });

    if (existingUser)
      throw new ConflictException('This contact is already registered');

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = this.userRepository.create({
      firstName: session.firstName,
      lastName: session.lastName,
      dateOfBirth: session.dateOfBirth,
      gender: session.gender,
      cin: session.cin,
      contact: session.contact,
      passwordHash,
    });

    const savedUser = await this.userRepository.save(user);

    await this.registrationSessionRepository.delete(session.id);

    return {
      userId: savedUser.id,
      message: 'Registration completed successfully',
    };
  }




  async validateCredentials(data : LoginDto){
    const user = await this.userRepository.findOne({
      where: {contact: data.contact.trim() },
    });
    if (!user)
        throw new UnauthorizedException('Invalid contact or password');

    const passwordMatches = await  bcrypt.compare(data.password, user.passwordHash,
    );
    if(!passwordMatches)
        throw new UnauthorizedException('invalid contact or password');
      return{
        userId: user.id,
        contact: user.contact, 
      }
  }
}