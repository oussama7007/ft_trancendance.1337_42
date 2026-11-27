import {
    IsNotEmpty,
    IsString,
} from 'class-validator';

export class SetupTotpDto {
    @IsString()
    @IsNotEmpty()
    currentPassword: string;
}
