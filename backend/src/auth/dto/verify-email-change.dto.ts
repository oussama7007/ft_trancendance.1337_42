import { IsString, Matches } from 'class-validator';

export class VerifyEmailChangeDto {
    @IsString()
    @Matches(/^\d{6}$/)
    code: string;
}