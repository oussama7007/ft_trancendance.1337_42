import { ReviewRole } from './../entities/review.entity.js'

// What the server answers. Keep these identical to the types in
// frontend/src/services/reviewService.ts. They are classes, not interfaces,
// because they appear in decorated controller methods. They have no
// validation decorators: they only describe a shape.

// The person who wrote a review. The frontend takes the avatar letter from the name.
export class ReviewerDto
{
    id: number;

    name: string;
}

// One review card.
export class ReviewResponseDto
{
    id: number;

    // Stars, 1 to 5.
    rating: number;

    comment: string;

    // 'owner' or 'roommate': what the reviewer is for the reviewed person.
    role: ReviewRole;

    reviewer: ReviewerDto;

    // The green line on the card, in the three languages.
    listingTitle: { ar: string; fr: string; en: string };

    // Travels as a date string in the JSON.
    createdAt: Date;
}

// The "Overall rating" card. It covers every review, not only the open tab.
export class ReviewsSummaryDto
{
    average: number;

    count: number;
}

// The three numbers on the tabs: All, Owner reviews, Roommate reviews.
export class ReviewCountsDto
{
    all: number;

    owner: number;

    roommate: number;
}

// The whole answer of the list route, so the page loads with one request.
export class ReviewsResultDto
{
    reviews: ReviewResponseDto[];

    summary: ReviewsSummaryDto;

    counts: ReviewCountsDto;
}

// Answer of the can-review route: does the "Leave a review" button show, and
// as which role. role is null when allowed is false.
export class CanReviewDto
{
    allowed: boolean;

    role: ReviewRole | null;
}
