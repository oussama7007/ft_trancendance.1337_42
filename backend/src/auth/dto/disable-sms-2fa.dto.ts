import {
    IsNotEmpty,
    IsString,
} from 'class-validator';

export class DisableSms2faDto {
    @IsString()
    @IsNotEmpty()
    currentPassword: string;
}