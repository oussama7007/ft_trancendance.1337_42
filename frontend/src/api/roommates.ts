import type { Roommate } from '../types/roommate';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface RoommateFilters {
  city?: string;
  maxBudget?: number;
  gender?: string;
}

export async function fetchRoommates(filters: RoommateFilters, signal?: AbortSignal): Promise<Roommate[]> {
  const params = new URLSearchParams();

  if (filters.city?.trim()) params.set('city', filters.city.trim());

  if (filters.maxBudget !== undefined) params.set('maxBudget', String(filters.maxBudget));

  if (filters.gender) params.set('gender', filters.gender);

  const response = await fetch(`${API_URL}/roommates?${params.toString()}`, { signal });

  if (!response.ok) {
    throw new Error(`Failed to load roommates (${response.status})`);
  }

  return response.json();
}
