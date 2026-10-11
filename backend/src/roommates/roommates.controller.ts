import { Controller, Get, Query } from '@nestjs/common';
import { RoommatesService } from './roommates.service';
import { FilterRoommatesDto } from './filter-roommates.dto';
import { Roommate } from './mock-roommates';

@Controller('roommates')
export class RoommatesController
{
  constructor(private readonly roommatesService: RoommatesService) {}

  @Get()
  getRoommates(@Query() query: FilterRoommatesDto): Roommate[] {
    return this.roommatesService.filter(query);
  }
}
