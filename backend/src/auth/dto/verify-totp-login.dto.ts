import {
    IsNotEmpty,
    IsString,
} from 'class-validator';

export class VerifyTotpLoginDto {
    @IsString()
    @IsNotEmpty()
    challengeToken: string;

    @IsString()
    @IsNotEmpty()
    code: string;
}
