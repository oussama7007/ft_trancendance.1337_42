import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Listing } from '../listings/listing.entity.js';
import { ListingsModule } from '../listings/listings.module.js';
import { RoommatePost } from './roommate-post.entity.js';
import { RoommatesController } from './roommates.controller.js';
import { RoommatesService } from './roommates.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoommatePost, Listing]),
    AuthModule,
    ListingsModule,
  ],
  controllers: [RoommatesController],
  providers: [RoommatesService],
})
export class RoommatesModule {}
