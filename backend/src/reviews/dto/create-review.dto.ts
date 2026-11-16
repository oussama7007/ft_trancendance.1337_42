import { IsInt, Min, Max, IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

// What the frontend sends to write a review (POST body). Anything that does not
// match is refused with a 400 before the controller runs.
//
// The reviewer and the role are not here on purpose: the server finds them
// itself, so nobody can lie about who they are.
export class CreateReviewDto
{
    // Whole number from 1 to 5 (the stars). Same rule as CHK_review_rating.
    @IsInt()
    @Min(1)
    @Max(5)
    rating!: number;

    // Trim first, so a comment made only of spaces becomes '' and is refused.
    // 500 is the same limit as CHK_review_comment_length.
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    comment!: string;
}
