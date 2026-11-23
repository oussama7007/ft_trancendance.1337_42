import { Body, Controller, Patch, Post, Res, HttpStatus, HttpCode, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';

import { StartEmailChangeDto } from './dto/start-email-change.dto.js';
import { VerifyEmailChangeDto } from './dto/verify-email-change.dto.js';


import { StartRegistrationDto } from './dto/start-registration.dto.js';
import { RequestVerificationDto } from './dto/request-verification.dto.js';
import { VerifyRegistrationDto } from './dto/verify-registration.dto.js';
import { FinishRegistrationDto } from './dto/finish-registration.dto.js';



import { GoogleCredentialDto } from './dto/google-credential.dto.js';
import { PhoneNumberDto } from './dto/phone-number.dto.js';
import { VerifyPhoneDto } from './dto/verify-phone.dto.js';
import { VerifyLogin2faDto } from './dto/verify-login-2fa.dto.js';
import { DisableSms2faDto } from './dto/disable-sms-2fa.dto.js';


import { ChangePasswordDto } from './dto/change-password.dto.js';

import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import type { AuthenticatedRequest } from './jwt-auth.guard.js';

import type { Response } from 'express';

@Controller('auth')
export class AuthController {

  constructor(private readonly authService: AuthService) {}


    private setAccessCookie(
    response: Response,
    accessToken: string,
) {
    response.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
    });
}

@Post('google/link')
@UseGuards(JwtAuthGuard)
linkGoogle(
    @Req() request: AuthenticatedRequest,
    @Body() data: GoogleCredentialDto,
) {
    return this.authService.linkGoogleAccount(
        request.user!.sub,
        data.credential,
        data.accessToken,
    );
}

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
  async finishRegistration(
              @Body() data: FinishRegistrationDto,
          @Res({ passthrough: true }) response: Response,
      ) {
          const result = await this.authService.finishRegistration(data);

          response.cookie('access_token', result.accessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 7 * 24 * 60 * 60 * 1000,
              path: '/',
          });

          return {
              user: result.user,
              message: result.message,
          };
      }


@HttpCode(HttpStatus.OK)
@Post('login')
async login(
    @Body() data: LoginDto,
    @Res({ passthrough: true }) response: Response,
) {
    const result = await this.authService.validateCredentials(data);

    if ('accessToken' in result) {
        this.setAccessCookie(response, result.accessToken);

        return {
            requiresTwoFactor: false,
            user: result.user,
        };
    }

    return result;
}

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
      response.clearCookie('access_token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
      });

      return {
          message: 'Logged out successfully',
      };
  }



    @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Req() request: AuthenticatedRequest) {
    if (request.user)
      return this.authService.getCurrentUser(request.user.sub);
    return null;
  }





@Post('google/login')
async googleLogin(
    @Body() data: GoogleCredentialDto,
    @Res({ passthrough: true }) response: Response,
) {
    const result = await this.authService.loginWithGoogle(
        data.credential,
        data.accessToken,
    );

    if ('accessToken' in result) {
        this.setAccessCookie(response, result.accessToken);

        return {
            requiresTwoFactor: false,
            user: result.user,
        };
    }

    return result;
}


@Get('security')
@UseGuards(JwtAuthGuard)
getSecuritySettings(
    @Req() request: AuthenticatedRequest,
) {
    return this.authService.getSecuritySettings(
        request.user!.sub,
    );
}





  @Patch('password')
@UseGuards(JwtAuthGuard)
changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() data: ChangePasswordDto,
) {
    return this.authService.changePassword(
        request.user!.sub,
        data,
    );
}

@Post('2fa/phone/start')
@UseGuards(JwtAuthGuard)
startPhoneVerification(
    @Req() request: AuthenticatedRequest,
    @Body() data: PhoneNumberDto,
) {
    return this.authService.startPhoneVerification(
        request.user!.sub,
        data.phoneNumber,
    );
}

@Post('2fa/phone/verify')
@UseGuards(JwtAuthGuard)
verifyPhone(
    @Req() request: AuthenticatedRequest,
    @Body() data: VerifyPhoneDto,
) {
    return this.authService.verifyAndSavePhoneNumber(
        request.user!.sub,
        data.phoneNumber,
        data.code,
    );
}

@Post('2fa/enable')
@UseGuards(JwtAuthGuard)
enableSms2fa(
    @Req() request: AuthenticatedRequest,
) {
    return this.authService.enableSms2fa(
        request.user!.sub,
    );
}

@Post('2fa/disable')
@UseGuards(JwtAuthGuard)
disableSms2fa(
    @Req() request: AuthenticatedRequest,
    @Body() data: DisableSms2faDto,
) {
    return this.authService.disableSms2fa(
        request.user!.sub,
        data.currentPassword,
    );
}

@Post('2fa/login/verify')
async verifyLogin2fa(
    @Body() data: VerifyLogin2faDto,
    @Res({ passthrough: true }) response: Response,
) {
    const result = await this.authService.verifyLoginChallenge(
        data.challengeToken,
        data.code,
    );

    this.setAccessCookie(response, result.accessToken);

    return {
        user: result.user,
    };
}


@Post('email/change/start')
@UseGuards(JwtAuthGuard)
startEmailChange(
    @Req() request: AuthenticatedRequest,
    @Body() data: StartEmailChangeDto,
) {
    return this.authService.startEmailChange(
        request.user!.sub,
        data.email,
        data.currentPassword,
    );
}


@Post('email/change/verify')
@UseGuards(JwtAuthGuard)
verifyEmailChange(
    @Req() request: AuthenticatedRequest,
    @Body() data: VerifyEmailChangeDto,
) {
    return this.authService.verifyEmailChange(
        request.user!.sub,
        data.code,
    );
}
}