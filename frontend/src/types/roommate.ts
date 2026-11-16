import type { Listing } from './index';

export type GenderChoice = 'any' | 'male' | 'female';

export interface Roommate {
  id: number;
  monthlyShare: number;
  peopleWanted: number;
  genderPreference: GenderChoice;
  listing: Listing;
}

export interface NewRoommatePost {
  listingId: number;
  monthlyShare: number;
  peopleWanted: number;
  genderPreference: GenderChoice;
}
