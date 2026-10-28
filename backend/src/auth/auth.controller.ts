import { Body, Controller, Post,   HttpStatus, HttpCode, Get, Req, UseGuards} from '@nestjs/common';
import { AuthService } from './auth.service.js';

import { StartRegistrationDto } from './dto/start-registration.dto.js';
import { RequestVerificationDto } from './dto/request-verification.dto.js';
import { VerifyRegistrationDto } from './dto/verify-registration.dto.js';
import { FinishRegistrationDto } from './dto/finish-registration.dto.js';


import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import type { AuthenticatedRequest } from './jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/start')
  startRegistration(@Body() data: StartRegistrationDto) {
    return this.authService.startRegistration(data);
  }

  @Post('register/contact')
  requestVerification(@Body() data: RequestVerificationDto) {
    return this.authService.requestVerification(data);
  }

  @Post('register/verify')
  verifyRegistration(@Body() data: VerifyRegistrationDto) {
    return this.authService.verifyRegistration(data);
  }

  @Post('register/finish')
  finishRegistration(@Body() data: FinishRegistrationDto) {
    return this.authService.finishRegistration(data);
  }


  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() data : LoginDto)
  {
    return this.authService.validateCredentials(data);
  }


    @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Req() request: AuthenticatedRequest) {
    if (request.user)
      return this.authService.getCurrentUser(request.user.sub);
    return null;
  }
}