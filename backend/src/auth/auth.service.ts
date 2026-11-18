


import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,

} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
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


import { MailService } from '../mail/mail.service.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RegistrationSession)
    private readonly registrationSessionRepository: Repository<RegistrationSession>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService, 

    private readonly mailService: MailService,
  ) {}
  

  private validateDateOfBirth(dateOfBirth: string): void {
        const birthDate = new Date(dateOfBirth);

        if (isNaN(birthDate.getTime())) {
            throw new BadRequestException('Invalid date of birth');
        }

        const today = new Date(
            new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Africa/Casablanca',
            }).format(new Date()),
        );

        const minimumDate = new Date(today);
        minimumDate.setFullYear(today.getFullYear() - 18);

        if (birthDate > minimumDate) {
            throw new BadRequestException(
                'You must be at least 18 years old',
            );
        }
  } 


  async startRegistration(data: StartRegistrationDto) {
    
    
    
    this.validateDateOfBirth(data.dateOfBirth);
    
    
    const session = this.registrationSessionRepository.create(data);


    const savedSession = await this.registrationSessionRepository.save(session);

    return {
      sessionId: savedSession.id,
      message: 'Registration started',
    };
  }


  async requestVerification(data: RequestVerificationDto) {
    const session = await this.registrationSessionRepository.findOne({
      where: { id: data.sessionId },
    });

    if (!session)
      throw new NotFoundException('Registration session not found');

    const email = data.email.trim().toLowerCase();


    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser)
      throw new ConflictException('This contact is already registered');

    const code = randomInt(0, 1000000).toString().padStart(6, '0');

    session.email = email;
    session.verificationCode = code;
    session.verificationCodeExpiresAt =
      new Date(Date.now() + 5 * 60 * 1000);
    session.isVerified = false;

    await this.registrationSessionRepository.save(session);

    await this.mailService.sendVerificationCode(email, code);

    return {
      sessionId: session.id,
      message: 'Verification code generated',
    };
  }


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


  async finishRegistration(data: FinishRegistrationDto) {
    const session = await this.registrationSessionRepository.findOne({
      where: { id: data.sessionId },
    });

    if (!session)
      throw new NotFoundException('Registration session not found');

    if (!session.isVerified || !session.email)
      throw new BadRequestException('Verify your email first');

    const existingUser = await this.userRepository.findOne({
      where: { email: session.email },
    });

    if (existingUser)
      throw new ConflictException('This contact is already registered');

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = this.userRepository.create({
      firstName: session.firstName,
      lastName: session.lastName,
      dateOfBirth: session.dateOfBirth,
      gender: session.gender,
    
      email: session.email,
      passwordHash,
    });

    const savedUser = await this.userRepository.save(user);

    await this.registrationSessionRepository.delete(session.id);

    return {
      userId: savedUser.id,
      message: 'Registration completed successfully',
    };
  }

    async getCurrentUser(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,

      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      contact: user.email,
    };
  }


  async validateCredentials(data : LoginDto){
    const user = await this.userRepository.findOne({
      where: {email: data.contact.trim() },
    });
    if (!user)
        throw new UnauthorizedException('Invalid contact or password');

    const passwordMatches = await  bcrypt.compare(data.password, user.passwordHash,
    );
    if(!passwordMatches)
        throw new UnauthorizedException('invalid contact or password');
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        dateOfBirth: user.dateOfBirth,
        contact: user.email,
      },
    };
  }
}