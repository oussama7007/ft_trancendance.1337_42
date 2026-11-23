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

@Controller('users/:userId/reviews')
export class ReviewsController
{
    constructor(private readonly reviewsService: ReviewsService) {}

    // reviews of a profile with the rating and tab counts
    @Get()
    findByUser(
        @Param('userId', ParseIntPipe) userId: number,
        @Query() query: ReviewsQueryDto
    ): Promise<ReviewsResultDto>
    {
        return this.reviewsService.findByUser(userId, query.role ?? 'all');
    }

    // can the current user review this profile
    @Get('can-review')
    canReview(
        @Param('userId', ParseIntPipe) userId: number,
        @CurrentUserId() reviewerId: number
    ): Promise<CanReviewDto>
    {
        return this.reviewsService.canReview(reviewerId, userId);
    }

    // saves a review
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
