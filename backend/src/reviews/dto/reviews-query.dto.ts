import { IsIn, IsOptional } from 'class-validator';

// The query string of GET users/:userId/reviews?role=owner. It says which tab
// is open. A missing role means 'all', the service handles that default.
export class ReviewsQueryDto
{
    @IsOptional()
    @IsIn(['all', 'owner', 'roommate'])
    role?: 'all' | 'owner' | 'roommate';
}
