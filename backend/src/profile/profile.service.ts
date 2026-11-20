import { Injectable, BadRequestException,NotFoundException } from '@nestjs/common';



import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../auth/user.entity.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';


@Injectable()
export class ProfileService {

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async getMyProfile(userId: number) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.toResponse(user);
    }

    async updateMyProfile(
        userId: number,
        data: UpdateProfileDto,
    ) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (data.firstName !== undefined) {
            user.firstName = data.firstName;
        }

        if (data.lastName !== undefined) {
            user.lastName = data.lastName;
        }

        if (data.bio !== undefined) {
            user.bio = data.bio.trim() || null;
        }

        if (data.linkedin !== undefined) {
            user.linkedin = this.validateSocialUrl(
                data.linkedin,
                'linkedin.com',
            );
        }

        if (data.instagram !== undefined) {
            user.instagram = this.validateSocialUrl(
                data.instagram,
                'instagram.com',
            );
        }

        if (data.facebook !== undefined) {
            user.facebook = this.validateSocialUrl(
                data.facebook,
                'facebook.com',
            );
        }

        const updatedUser = await this.userRepository.save(user);

        return this.toResponse(updatedUser);
    }

    private validateSocialUrl(
        value: string | null,
        domain: string,
    ): string | null {
        if (!value?.trim()) {
            return null;
        }

        const candidate = /^https?:\/\//i.test(value)
            ? value
            : `https://${value}`;

        try {
            const url = new URL(candidate);

            const validDomain =
                url.hostname === domain ||
                url.hostname.endsWith(`.${domain}`);

            if (
                (url.protocol !== 'https:' && url.protocol !== 'http:') ||
                !validDomain
            ) {
                throw new Error('Invalid URL');
            }

            return url.toString();
        } catch {
            throw new BadRequestException(
                `Invalid ${domain} URL`,
            );
        }
    }

    private toResponse(user: User) {
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: `${user.firstName} ${user.lastName}`,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            email: user.email,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            linkedin: user.linkedin,
            instagram: user.instagram,
            facebook: user.facebook,
        };
    }
}