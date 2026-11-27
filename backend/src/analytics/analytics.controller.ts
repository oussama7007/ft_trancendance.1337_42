import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { AnalyticsDashboard, AnalyticsService } from './analytics.service.js';
import { AnalyticsQueryDto } from './dto/analytics-query.dto.js';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // the owner's dashboard for the last 7, 30 or 90 days
  @Get()
  getDashboard(
    @Query() query: AnalyticsQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<AnalyticsDashboard> {
    return this.analyticsService.getDashboard(request.user!.sub, query.range);
  }

  // called when a signed-in user opens a listing's details
  @Post('views/:listingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  recordView(
    @Param('listingId', ParseIntPipe) listingId: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    return this.analyticsService.recordView(listingId, request.user!.sub);
  }
}
