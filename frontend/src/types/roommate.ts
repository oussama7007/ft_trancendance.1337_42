export interface Roommate
{
  id: number;
  city: string;
  district: string;
  price: number;
  ownerName: string;
  roommates: string[];
  genderPreference?: string;
  hasWifi: boolean;
  lat: number;
  lng: number;
}
