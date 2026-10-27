import { IsInt, IsString, IsPositive, MinLength } from 'class-validator';

export class FinishRegistrationDto {
  @IsInt()
  @IsPositive()
  sessionId: number;

  @IsString()
  @MinLength(8)
  password: string;
}