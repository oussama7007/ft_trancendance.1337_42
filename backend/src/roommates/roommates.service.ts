import { Injectable } from '@nestjs/common';
import { MOCK_ROOMMATES, Roommate } from './mock-roommates';
import { FilterRoommatesDto } from './filter-roommates.dto';

@Injectable()
export class RoommatesService
{
  private roommates: Roommate[] = MOCK_ROOMMATES;

  filter(filters: FilterRoommatesDto): Roommate[] {
    return this.roommates.filter((room) => {
      if (filters.city && room.city.toLowerCase() !== filters.city.toLowerCase()) {
        return false;
      }
      if (filters.district && room.district.toLowerCase() !== filters.district.toLowerCase()) {
        return false;
      }
      if (filters.maxBudget && room.price > filters.maxBudget) {
        return false;
      }
      return true;
    });
  }
}
