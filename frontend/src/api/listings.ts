import type { Listing } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type SortBy = 'id' | 'price' | 'bedrooms';
export type SortOrder = 'ASC' | 'DESC';

export interface ListingFilters {
  city?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPage: number;
}

export interface PaginatedListings {
  data: Listing[];
  meta: PaginationMeta;
}

export async function fetchListings(
  filters: ListingFilters,
  signal?: AbortSignal,
): Promise<PaginatedListings> {
  const params = new URLSearchParams();

  if (filters.city?.trim()) params.set('city', filters.city.trim());
  if (filters.type) params.set('type', filters.type);
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));

  if (filters.minBedrooms !== undefined) params.set('minBedrooms', String(filters.minBedrooms));
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const response = await fetch(`${API_URL}/listings?${params.toString()}`, { signal });

  if (!response.ok) {
    throw new Error(`Failed to load listings (${response.status})`);
  }

  return response.json();
}
