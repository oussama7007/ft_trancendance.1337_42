import { IsString, IsIn, IsOptional, IsDateString } from 'class-validator';

export class StartRegistrationDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsDateString()
  dateOfBirth: string;

  @IsIn(['male', 'female'])
  gender: string;

}
