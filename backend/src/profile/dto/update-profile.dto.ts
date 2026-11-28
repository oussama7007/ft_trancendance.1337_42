import { Transform } from 'class-transformer';
import {
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

export class UpdateProfileDto {
    @IsOptional()
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @MinLength(1)
    @MaxLength(20)
    firstName?: string;

    @IsOptional()
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @MinLength(1)
    @MaxLength(20)
    lastName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    bio?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    linkedin?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    instagram?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    facebook?: string | null;
}