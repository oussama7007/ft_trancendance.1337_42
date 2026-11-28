import { IsString, IsUUID, Matches } from 'class-validator';

export class VerifyRegistrationDto {
  @IsUUID('4')
  sessionId: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Verification code must be 6 digits' })
  code: string;
}
