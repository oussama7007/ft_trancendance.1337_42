import { IsInt, IsString, IsPositive } from 'class-validator';

export class VerifyRegistrationDto
{
  @IsInt()
  @IsPositive()
  sessionId: number;

  @IsString()
  code: string;
}