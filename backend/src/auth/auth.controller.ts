import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { StartRegistrationDto } from './dto/start-registration.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/start')
  startRegistration(@Body() data: StartRegistrationDto) {
    return this.authService.startRegistration(data);
  }
}