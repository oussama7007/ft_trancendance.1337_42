import { Transform } from 'class-transformer';

import { IsString, IsIn,Matches, IsDateString, IsNotEmpty } from 'class-validator';

export class StartRegistrationDto {

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  firstName: string;


  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date of birth must use YYYY-MM-DD format',
  })
  dateOfBirth: string;

  @IsIn(['male', 'female'])
  gender: string;

}
