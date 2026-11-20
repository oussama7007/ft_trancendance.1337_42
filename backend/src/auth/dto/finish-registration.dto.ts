import { IsInt, IsString, IsPositive, MinLength, Matches, MaxLength } from 'class-validator';

export class FinishRegistrationDto {
  @IsInt()
  @IsPositive()
  sessionId: number;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
      @Matches(/[a-z]/, {
        message: 'Password must contain a lowercase letter',
    })
    @Matches(/[A-Z]/, {
        message: 'Password must contain an uppercase letter',
    })
    @Matches(/[0-9]/, {
        message: 'Password must contain a number',
    })
    @Matches(/[^a-zA-Z0-9\s]/, {
        message: 'Password must contain a special character',
    })

  password: string;
}