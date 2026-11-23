import {
    IsString,
    Matches,
} from 'class-validator';

export class PhoneNumberDto {
    @IsString()
    @Matches(/^\+[1-9]\d{7,14}$/)
    phoneNumber: string;
}