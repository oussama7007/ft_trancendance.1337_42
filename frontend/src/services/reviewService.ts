import type { Language } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type ReviewRole = 'owner' | 'roommate';
export type ReviewTab = 'all' | ReviewRole;

// These types mirror the DTOs in the backend (review-response.dto.ts).
export interface Review
{
  id: number;
  rating: number;
  comment: string;
  role: ReviewRole;
  reviewer: { id: number; name: string };
  listingTitle: Record<Language, string>;
  createdAt: string;
}

export interface ReviewsResult
{
  reviews: Review[];
  summary: { average: number; count: number };
  counts: { all: number; owner: number; roommate: number };
}

export interface CanReview
{
  allowed: boolean;
  role: ReviewRole | null;
}

// Sends the request and throws if the server says no.
async function request(url: string, options?: RequestInit): Promise<Response>
{
  const response = await fetch(`${API_URL}${url}`, options);

  if (!response.ok)
    throw new Error(`Request failed with status ${response.status}`);

  return response;
}

// TODO(auth): `reviewerId` goes in the query string only until login exists.
export const reviewService =
{
  // The reviews of one profile, for the open tab.
  async getByUser(userId: number, tab: ReviewTab): Promise<ReviewsResult>
  {
    const response = await request(`/users/${userId}/reviews?role=${tab}`);
    return response.json() as Promise<ReviewsResult>;
  },

  // Asks if I can leave a review on this profile.
  async canReview(userId: number, reviewerId: number): Promise<CanReview>
  {
    const response = await request(`/users/${userId}/reviews/can-review?userId=${reviewerId}`);
    return response.json() as Promise<CanReview>;
  },

  // Saves my review of this profile.
  async create(userId: number, reviewerId: number, rating: number, comment: string): Promise<void>
  {
    await request(`/users/${userId}/reviews?userId=${reviewerId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment })
    });
  }
};
