import { IsIn, IsInt, Max, Min } from 'class-validator';

export class CreateRoommatePostDto {
  @IsInt()
  @Min(1)
  listingId: number;

  @IsInt()
  @Min(1)
  @Max(1000000)
  monthlyShare: number;

  @IsInt()
  @Min(1)
  @Max(20)
  peopleWanted: number;

  @IsIn(['any', 'male', 'female'])
  genderPreference: string;
}
