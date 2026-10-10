import { IsInt, IsString, IsPositive, Length } from 'class-validator';

export class VerifyRegistrationDto {
  @IsInt()
  @IsPositive()
  sessionId: number;

  @IsString()
  @Length(6, 6)
  code: string;
}