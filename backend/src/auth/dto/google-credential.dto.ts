import {
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';

export class GoogleCredentialDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    credential?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    accessToken?: string;
}
