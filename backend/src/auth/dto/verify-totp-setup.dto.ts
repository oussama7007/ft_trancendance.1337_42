import {
    IsNotEmpty,
    IsString,
} from 'class-validator';

export class VerifyTotpSetupDto {
    @IsString()
    @IsNotEmpty()
    token: string;

    @IsString()
    @IsNotEmpty()
    code: string;
}
