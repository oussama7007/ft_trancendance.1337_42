import { Controller, Get, Query } from '@nestjs/common';
import { ListingsService } from './listings.service.js';
import { FilterListingsDto } from './dto/filter-listings.dto.js';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  findAll(@Query() filters: FilterListingsDto) {
    return this.listingsService.findAll(filters);
  }
}
