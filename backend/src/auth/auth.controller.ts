import { Body, Controller, Patch, Post, Res, HttpStatus, HttpCode, Get, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service.js';

import { StartEmailChangeDto } from './dto/start-email-change.dto.js';
import { VerifyEmailChangeDto } from './dto/verify-email-change.dto.js';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto.js';
import { VerifyPasswordResetDto } from './dto/verify-password-reset.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';


import { StartRegistrationDto } from './dto/start-registration.dto.js';
import { RequestVerificationDto } from './dto/request-verification.dto.js';
import { VerifyRegistrationDto } from './dto/verify-registration.dto.js';
import { FinishRegistrationDto } from './dto/finish-registration.dto.js';



import { GoogleCredentialDto } from './dto/google-credential.dto.js';
import { SetupTotpDto } from './dto/setup-totp.dto.js';
import { VerifyTotpSetupDto } from './dto/verify-totp-setup.dto.js';
import { VerifyTotpLoginDto } from './dto/verify-totp-login.dto.js';
import { DisableTotpDto } from './dto/disable-totp.dto.js';
import { RegenerateRecoveryCodesDto } from './dto/regenerate-recovery-codes.dto.js';


import { ChangePasswordDto } from './dto/change-password.dto.js';

import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard, OptionalJwtAuthGuard } from './jwt-auth.guard.js';
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
        secure: true,
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
        data.currentPassword,
        data.code,
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
              secure: true,
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
          secure: true,
          sameSite: 'lax',
          path: '/',
      });

      return {
          message: 'Logged out successfully',
      };
  }



  // Visitors who are not signed in get 200 with an empty body (null), so the
  // browser console stays free of 401 errors on every page load.
  @Get('me')
  @UseGuards(OptionalJwtAuthGuard)
  async getCurrentUser(@Req() request: AuthenticatedRequest) {
    if (!request.user)
      return null;

    try {
      return await this.authService.getCurrentUser(request.user.sub);
    } catch (error) {
      // The account behind a still-valid token was deleted: treat as signed out.
      if (error instanceof NotFoundException)
        return null;
      throw error;
    }
  }





@Post('google/login')
async googleLogin(
    @Body() data: GoogleCredentialDto,
    @Res({ passthrough: true }) response: Response,
) {
    const result = await this.authService.loginWithGoogle(
        data.credential,
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

@Post('2fa/totp/setup')
@UseGuards(JwtAuthGuard)
setupTotp(
    @Req() request: AuthenticatedRequest,
    @Body() data: SetupTotpDto,
) {
    return this.authService.setupTotp(
        request.user!.sub,
        data.currentPassword,
    );
}

@Post('2fa/totp/verify-setup')
@UseGuards(JwtAuthGuard)
verifyTotpSetup(
    @Req() request: AuthenticatedRequest,
    @Body() data: VerifyTotpSetupDto,
) {
    return this.authService.verifyTotpSetup(
        request.user!.sub,
        data.token,
        data.code,
    );
}

@Post('2fa/totp/disable')
@UseGuards(JwtAuthGuard)
disableTotp(
    @Req() request: AuthenticatedRequest,
    @Body() data: DisableTotpDto,
) {
    return this.authService.disableTotp(
        request.user!.sub,
        data.currentPassword,
        data.code,
    );
}

@Post('2fa/totp/regenerate-recovery')
@UseGuards(JwtAuthGuard)
regenerateRecoveryCodes(
    @Req() request: AuthenticatedRequest,
    @Body() data: RegenerateRecoveryCodesDto,
) {
    return this.authService.regenerateRecoveryCodes(
        request.user!.sub,
        data.currentPassword,
    );
}

@Post('2fa/totp/login/verify')
async verifyTotpLogin(
    @Body() data: VerifyTotpLoginDto,
    @Res({ passthrough: true }) response: Response,
) {
    const result = await this.authService.verifyTotpLogin(
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

@Post('password/reset/request')
requestPasswordReset(@Body() data: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(data);
}

@Post('password/reset/verify')
verifyPasswordReset(@Body() data: VerifyPasswordResetDto) {
    return this.authService.verifyPasswordReset(data);
}

@Post('password/reset')
resetPassword(@Body() data: ResetPasswordDto) {
    return this.authService.resetPassword(data);
}
}