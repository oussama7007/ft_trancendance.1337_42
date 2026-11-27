import { IsString, Matches } from 'class-validator';

export class VerifyEmailChangeDto {
    @IsString()
    @Matches(/^\d{8}$/)
    code: string;
}
