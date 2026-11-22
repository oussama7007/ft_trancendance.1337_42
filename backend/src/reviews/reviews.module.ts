import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Handshake } from '../handshake/entities/handshake.entity.js';
import { Review } from './entities/review.entity.js';
import { ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';

@Module({
    imports:        [TypeOrmModule.forFeature([Review, Handshake])],
    controllers:    [ReviewsController],
    providers:      [ReviewsService],
})
export class ReviewsModule {}
