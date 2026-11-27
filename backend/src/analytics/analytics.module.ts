import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { InterestRequest } from '../chat/entities/interest-request.entity.js';
import { Listing } from '../listings/listing.entity.js';
import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';
import { ListingView } from './listing-view.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([ListingView, Listing, InterestRequest]), AuthModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
