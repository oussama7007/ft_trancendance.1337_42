import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Handshake } from '../handshake/entities/handshake.entity.js';
import { Review } from './entities/review.entity.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { CanReviewDto, ReviewsResultDto } from './dto/review-response.dto.js';
import { buildCounts, buildSummary, filterByRole, toReviewResponse } from './reviews.utils.js';

// postgres unique error
const UNIQUE_VIOLATION = '23505';

@Injectable()
export class ReviewsService
{
    constructor(
        @InjectRepository(Review) private readonly reviewRepository: Repository<Review>,
        @InjectRepository(Handshake) private readonly handshakeRepository: Repository<Handshake>) {}

    // reviews of a user with the summary and counts
    async findByUser(userId: number, role: 'all' | 'owner' | 'roommate'): Promise<ReviewsResultDto>
    {
        const rows = await this.reviewRepository.find({
            where: { reviewedId: userId },
            relations: { reviewer: true, handshake: { listing: true } },
            order: { createdAt: 'DESC' }
        });

        const all = rows.map(toReviewResponse);
        return {
            reviews: filterByRole(all, role),
            summary: buildSummary(all),
            counts: buildCounts(all)
        };
    }

    // checks if the button should show
    async canReview(reviewerId: number, reviewedId: number): Promise<CanReviewDto>
    {
        const handshake = await this.findReviewableHandshake(reviewerId, reviewedId);
        if (!handshake)
            return { allowed: false, role: null };
        return { allowed: true, role: 'owner' };
    }

    // saves a new review
    async create(reviewerId: number, reviewedId: number, dto: CreateReviewDto): Promise<void>
    {
        if (reviewerId === reviewedId)
            throw new BadRequestException('You cannot review yourself');

        const handshake = await this.findReviewableHandshake(reviewerId, reviewedId);
        if (!handshake)
            throw new ForbiddenException('You have no confirmed handshake to review');

        try
        {
            await this.reviewRepository.insert({
                handshakeId: handshake.id,
                reviewerId,
                reviewedId,
                role: 'owner',
                rating: dto.rating,
                comment: dto.comment,
            });
        }
        catch (error)
        {
            if ((error as { code?: string }).code === UNIQUE_VIOLATION)
                throw new ConflictException('You already reviewed this handshake');
            throw error;
        }
    }

    // confirmed handshake i did not review yet
    private async findReviewableHandshake(reviewerId: number, reviewedId: number): Promise<Handshake | null>
    {
        const handshake = await this.handshakeRepository.findOne({
            where: {
                ownerId: reviewerId,
                clientId: reviewedId,
                confirmedAt: Not(IsNull()),
            },
        });
        if (!handshake)
            return null;

        const already = await this.reviewRepository.findOneBy({ handshakeId: handshake.id, reviewerId });
        return already ? null : handshake;
    }
}
