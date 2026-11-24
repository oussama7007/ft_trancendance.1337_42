import {
    IsString,
    Matches,
} from 'class-validator';

export class VerifyPhoneDto {
    @IsString()
    @Matches(/^\+[1-9]\d{7,14}$/)
    phoneNumber: string;

    @IsString()
    @Matches(/^\d{4,8}$/)
    code: string;
}