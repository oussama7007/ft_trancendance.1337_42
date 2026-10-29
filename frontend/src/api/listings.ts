import type { Listing } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';


export interface ListingFilters {
  city?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
}

export async function fetchListings(
  filters: ListingFilters,
  signal?: AbortSignal,
): Promise<Listing[]> {
  const params = new URLSearchParams();

  if (filters.city?.trim()) params.set('city', filters.city.trim());
  if (filters.type) params.set('type', filters.type);
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));

  const response = await fetch(`${API_URL}/listings?${params.toString()}`, { signal });

  if (!response.ok) {
    throw new Error(`Failed to load listings (${response.status})`);
  }

  return response.json();
}