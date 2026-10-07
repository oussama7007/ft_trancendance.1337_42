import { IsString } from 'class-validator';

export class VerifyRegistrationDto
{
  @IsString()
  contact: string;

  @IsString()
  code: string;
}