import {
    IsNotEmpty,
    IsString,
} from 'class-validator';

export class RegenerateRecoveryCodesDto {
    @IsString()
    @IsNotEmpty()
    currentPassword: string;
}
