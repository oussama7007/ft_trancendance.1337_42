import {
    IsString,
    Matches,
    MinLength,
    MaxLength,
} from 'class-validator';

export class ChangePasswordDto {
    @IsString()
    @MinLength(1)
    currentPassword: string;

    @IsString()
    @MinLength(8)
    @MaxLength(64)
    @Matches(/[a-z]/, {
        message: 'Password must contain a lowercase letter',
    })
    @Matches(/[A-Z]/, {
        message: 'Password must contain an uppercase letter',
    })
    @Matches(/[0-9]/, {
        message: 'Password must contain a number',
    })
    @Matches(/[^a-zA-Z0-9\s]/, {
        message: 'Password must contain a special character',
    })
    newPassword: string;
}
