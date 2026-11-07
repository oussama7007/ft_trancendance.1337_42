import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Handshake } from '../handshake/entities/handshake.entity.js';
import { Review } from './entities/review.entity.js';
import { ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';

// Groups everything about reviews the tables the routes and the logic
@Module({
    imports:        [TypeOrmModule.forFeature([Review, Handshake])],
    controllers:    [ReviewsController],
    providers:      [ReviewsService],
})
export class ReviewsModule {}
