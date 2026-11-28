import { IsEmail, IsHexadecimal, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
    @IsEmail()
    email: string;

    // Single-use grant returned by POST /auth/password/reset/verify.
    @IsHexadecimal()
    @Length(64, 64)
    grantToken: string;

    // Same password policy as registration (finish-registration.dto.ts).
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
