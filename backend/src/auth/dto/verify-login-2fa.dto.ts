import {
    IsString,
    Length,
    Matches,
} from 'class-validator';

export class VerifyLogin2faDto {
    @IsString()
    @Length(64, 64)
    challengeToken: string;

    @IsString()
    @Matches(/^\d{4,8}$/)
    code: string;
}