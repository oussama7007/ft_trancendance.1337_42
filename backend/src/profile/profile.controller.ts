import { Controller,
        Get,
    Patch,
    Req,
    UseGuards,
     Body,
 } from '@nestjs/common';


 import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard.js';

import { ProfileService } from './profile.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';



@Controller('profile')
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {

    constructor(
        private readonly profileService: ProfileService,
    ) {}

    @Get('me')
    getMyProfile(@Req() request: AuthenticatedRequest) {
        return this.profileService.getMyProfile(
            request.user!.sub,
        );
    }

    @Patch('me')
    updateMyProfile(
        @Req() request: AuthenticatedRequest,
        @Body() data: UpdateProfileDto,
    ) {
        return this.profileService.updateMyProfile(
            request.user!.sub,
            data,
        );
    }
}