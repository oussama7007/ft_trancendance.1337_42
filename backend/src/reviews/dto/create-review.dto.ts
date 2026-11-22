import { IsInt, Min, Max, IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateReviewDto
{
    @IsInt()
    @Min(1)
    @Max(5)
    rating!: number;

    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    comment!: string;
}
