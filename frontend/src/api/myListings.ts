import type { Listing } from '../types';
import { ApiError } from './apiError';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface NewListing {
  title: string;
  description: string;
  type: string;
  cityAr: string;
  cityFr: string;
  cityEn: string;
  district: string;
  price: number;
  bedrooms: number;
  hasWifi: boolean;
  images: string[];
  video?: string;
  lat: number;
  lng: number;
}

export async function fetchMyListings(): Promise<Listing[]> {
  const response = await fetch(`${API_URL}/listings/mine`, { credentials: 'include' });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return response.json();
}

export async function uploadFiles(files: File[]): Promise<string[]> {
  const body = new FormData();
  files.forEach((file) => body.append('files', file));

  const response = await fetch(`${API_URL}/listings/upload`, {
    method: 'POST',
    credentials: 'include',
    body,
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return response.json();
}

export async function createListing(listing: NewListing): Promise<Listing> {
  const response = await fetch(`${API_URL}/listings`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(listing),
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return response.json();
}
