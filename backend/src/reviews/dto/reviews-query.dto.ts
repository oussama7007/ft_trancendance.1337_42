import { IsIn, IsOptional } from 'class-validator';

export class ReviewsQueryDto
{
    @IsOptional()
    @IsIn(['all', 'owner', 'roommate'])
    role?: 'all' | 'owner' | 'roommate';
}
