import
{
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Query,
} from '@nestjs/common';

import { CurrentUserId } from '../handshake/decorators/current-user-id.decorator.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { ReviewsQueryDto } from './dto/reviews-query.dto.js';
import { CanReviewDto, ReviewsResultDto } from './dto/review-response.dto.js';
import { ReviewsService } from './reviews.service.js';

// Routes for the reviews on a profile. :userId is the profile being viewed
// The reviewer is whoever is logged in (CurrentUserId)
@Controller('users/:userId/reviews')
export class ReviewsController
{
    constructor(private readonly reviewsService: ReviewsService) {}

    // The list + overall rating + tab counts for one profile
    @Get()
    findByUser(
        @Param('userId', ParseIntPipe) userId: number,
        @Query() query: ReviewsQueryDto
    ): Promise<ReviewsResultDto>
    {
        return this.reviewsService.findByUser(userId, query.role ?? 'all');
    }

    // Should the "Leave a review" button show for cuurent user on the profile
    @Get('can-review')
    canReview(
        @Param('userId', ParseIntPipe) userId: number,
        @CurrentUserId() reviewerId: number
    ): Promise<CanReviewDto>
    {
        return this.reviewsService.canReview(reviewerId, userId);
    }

    // to save the review of this profile
    @Post()
    create(
        @Param('userId', ParseIntPipe) userId: number,
        @CurrentUserId() reviewerId: number,
        @Body() dto: CreateReviewDto
    ): Promise<void>
    {
        return this.reviewsService.create(reviewerId, userId, dto);
    }
}
