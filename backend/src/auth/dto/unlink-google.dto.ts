import { IsNotEmpty, IsString } from 'class-validator';

export class UnlinkGoogleDto {
    @IsString()
    @IsNotEmpty()
    currentPassword: string;
}