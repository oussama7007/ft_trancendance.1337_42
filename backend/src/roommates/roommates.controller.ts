import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { CreateRoommatePostDto } from './dto/create-roommate-post.dto.js';
import { FilterRoommatesDto } from './dto/filter-roommates.dto.js';
import { RoommatesService } from './roommates.service.js';

@Controller('roommates')
export class RoommatesController {
  constructor(private readonly roommatesService: RoommatesService) {}

  @Get()
  search(@Query() filters: FilterRoommatesDto) {
    return this.roommatesService.search(filters);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createPost(
    @Req() request: AuthenticatedRequest,
    @Body() data: CreateRoommatePostDto,
  ) {
    return this.roommatesService.createPost(request.user!.sub, data);
  }
}
