import { Controller,
    BadRequestException,
    Body,
    Get,
    Patch,
    Post,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors, } from '@nestjs/common';


    import { FileInterceptor } from '@nestjs/platform-express';


import { ProfileService } from './profile.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { avatarUploadOptions } from './avatar-upload-options.js';

 import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard.js';




@Controller('profile')
@UseGuards(JwtAuthGuard)
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

        @Post('avatar')
    @UseInterceptors(
        FileInterceptor('avatar', avatarUploadOptions),
    )
    uploadAvatar(
        @Req() request: AuthenticatedRequest,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException(
                'Please select a valid image',
            );
        }

        const avatarUrl = `/uploads/avatars/${file.filename}`;

        return this.profileService.updateAvatar(
            request.user!.sub,
            avatarUrl,
        );
    }
}