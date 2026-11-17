import { IsString, IsIn,Matches, IsOptional, IsDateString } from 'class-validator';

export class StartRegistrationDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date of birth must use YYYY-MM-DD format',
  })
  dateOfBirth: string;

  @IsIn(['male', 'female'])
  gender: string;

}
