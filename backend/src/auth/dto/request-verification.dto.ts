import { IsInt, IsString, IsPositive } from 'class-validator';

export class RequestVerificationDto
{
  @IsInt()
  @IsPositive()
  sessionId: number;

  @IsString()
  contact: string;
}