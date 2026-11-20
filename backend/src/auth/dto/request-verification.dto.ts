import { IsInt, IsString, IsPositive, IsEmail } from 'class-validator';

export class RequestVerificationDto
{
  @IsInt()
  @IsPositive()
  sessionId: number;

  @IsEmail()
  @IsString()
  email: string;
}