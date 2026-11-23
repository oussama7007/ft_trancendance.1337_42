import { ReviewRole } from './../entities/review.entity.js'

// same types as the frontend reviewService

export class ReviewerDto
{
    id: number;

    name: string;
}

export class ReviewResponseDto
{
    id: number;

    rating: number;

    comment: string;

    role: ReviewRole;

    reviewer: ReviewerDto;

    listingTitle: { ar: string; fr: string; en: string };

    createdAt: Date;
}

export class ReviewsSummaryDto
{
    average: number;

    count: number;
}

export class ReviewCountsDto
{
    all: number;

    owner: number;

    roommate: number;
}

export class ReviewsResultDto
{
    reviews: ReviewResponseDto[];

    summary: ReviewsSummaryDto;

    counts: ReviewCountsDto;
}

export class CanReviewDto
{
    allowed: boolean;

    role: ReviewRole | null;
}
