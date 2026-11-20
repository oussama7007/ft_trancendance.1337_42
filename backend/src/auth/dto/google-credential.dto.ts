import {
    IsNotEmpty,
    IsString,
} from 'class-validator';

export class GoogleCredentialDto {
    @IsString()
    @IsNotEmpty()
    credential: string;
}