import type { ReviewRole, Review } from './entities/review.entity.js';
import type { ReviewCountsDto, ReviewResponseDto, ReviewsSummaryDto } from './dto/review-response.dto.js';


// "simon" + "jackson" -> "simon j."
export function formatName(firstName: string, lastName: string): string
{
    if (lastName === '')
        return firstName;
    return `${firstName} ${lastName.charAt(0)}.`;
}

// One review (with its reviewer and listing loaded) -> one card
export function toReviewResponse(review: Review): ReviewResponseDto
{
    return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        role: review.role,
        reviewer: {
            id: review.reviewerId,
            name: formatName(review.reviewer.firstName, review.reviewer.lastName),
        },
        listingTitle: review.handshake.listing.titleEn,
        createdAt: review.createdAt,
    };
}

// reviews average and number of reviews
export function buildSummary(reviews: ReviewResponseDto[]): ReviewsSummaryDto
{
    if (reviews.length === 0)
        return { average: 0, count: 0 };

    let total = 0;
    for (const review of reviews)
        total += review.rating;

    const average = Math.round((total / reviews.length) * 10) / 10;
    return { average, count: reviews.length };
}

// The three numbers shown on the tabs
export function buildCounts(reviews: ReviewResponseDto[]): ReviewCountsDto
{
    return {
        all: reviews.length,
        owner: reviews.filter((review) => review.role === 'owner').length,
        roommate: reviews.filter((review) => review.role === 'roommate').length,
    };
}

// Keeps only the reviews of the open tab while 'all' keeps everything
export function filterByRole(reviews: ReviewResponseDto[], role: 'all' | ReviewRole): ReviewResponseDto[]
{
    if (role === 'all')
        return reviews;
    return reviews.filter((review) => review.role === role);
}
