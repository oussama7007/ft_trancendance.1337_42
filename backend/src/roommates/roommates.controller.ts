import { Controller, Get, Query } from '@nestjs/common';
import { RoommatesService } from './roommates.service.js';
import { FilterRoommatesDto } from './filter-roommates.dto.js';
import { Roommate } from './mock-roommates.js';

// This is Responsible for request of /roomates
@Controller('roommates')
export class RoommatesController
{
  constructor(private readonly roommatesService: RoommatesService) {}

  @Get()
  getRoommates(@Query() query: FilterRoommatesDto): Roommate[] {
    return this.roommatesService.filter(query);
  }
}

// 			/roommates?city=rabat&district=maarif&maxbudget=2500
/* 
	{
		city=rabt,
		
	}
*/
// app.res.send(object)

