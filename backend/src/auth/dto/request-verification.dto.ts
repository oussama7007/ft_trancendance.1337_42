import { IsString, IsEmail, IsUUID } from 'class-validator';

export class RequestVerificationDto
{
  @IsUUID('4')
  sessionId: string;

  @IsEmail()
  @IsString()
  email: string;
}
