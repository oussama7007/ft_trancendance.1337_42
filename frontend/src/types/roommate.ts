// The shape of one room, exactly as the backend sends it from GET /roommates.
// It is a copy of the Roommate interface in backend/src/roommates/mock-roommates.ts,
// because the frontend cannot import files from the backend.
// An interface only describes a shape for TypeScript: nothing of it exists when the page runs.
export interface Roommate
{
  id: number;                // unique number of the room, used as the card's key
  city: string;              // city in lowercase, for example 'rabat'
  district: string;          // neighbourhood, for example 'agdal'
  price: number;             // monthly price in dirhams
  ownerName: string;         // the person who owns the flat
  roommates: string[];       // names of the people already living there
  genderPreference?: string; // 'male' or 'female'; the ? means a room may not have it
  hasWifi: boolean;          // true when the flat has WiFi
}
