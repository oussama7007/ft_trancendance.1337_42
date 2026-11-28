import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyPasswordResetDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    code: string;
}
