// Asks the backend for the rooms that match a search.
// It follows the same pattern as Said's api/listings.ts.
import type { Roommate } from '../types/roommate';

// The backend's address, read from frontend/.env.
// ?? means: if VITE_API_URL is missing, use 'http://localhost:3000' instead.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// What the search gives this function. Both fields are optional (the ?):
// an empty city means every city, and no budget means no price limit.
export interface RoommateFilters {
  city?: string;
  maxBudget?: number;
}

// async: this function waits for the network inside it.
// Promise<Roommate[]>: its answer is a list of rooms that arrives later.
export async function fetchRoommates(filters: RoommateFilters): Promise<Roommate[]> {
  // An empty collector for the "city=rabat&maxBudget=2000" part of the address.
  const params = new URLSearchParams();

  // Add the city only if one was typed. trim() removes spaces at both ends,
  // and ?. stops safely (gives undefined) when city is missing instead of crashing.
  if (filters.city?.trim()) params.set('city', filters.city.trim());

  // Add the budget only if there is one. An address carries text, so String() turns 2000 into "2000".
  if (filters.maxBudget !== undefined) params.set('maxBudget', String(filters.maxBudget));

  // Send the request and wait for the answer.
  // The backticks build the full address, for example http://localhost:3000/roommates?city=rabat&maxBudget=2000
  const response = await fetch(`${API_URL}/roommates?${params.toString()}`);

  // ok is true for statuses 200 to 299. Any other status (404, 500...) becomes an error
  // that the page catches and turns into a message for the user.
  if (!response.ok) {
    throw new Error(`Failed to load roommates (${response.status})`);
  }

  // Turn the JSON text of the answer into real objects: the list of rooms.
  return response.json();
}
