import type { Language } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type HandshakeStatus = 'none' | 'pending' | 'confirmed';

// A handshake as the person asking sees it. Mirrors HandshakeResponseDto in the backend
export interface Handshake
{
  status: HandshakeStatus;
  hasUserApproved: boolean;
}

// The listing a chat is about. Mirrors ChatHandshakeDto in the backend
export interface ChatListing
{
  id: number;
  clientId: number;
  title: Record<Language, string>;
}

// Sends one request with the login cookie and returns the json answer
async function request<T>(url: string, method: 'GET' | 'POST' = 'GET'): Promise<T>
{
  const response = await fetch(`${API_URL}${url}`, { method, credentials: 'include' });

  if (!response.ok)
    throw new Error(`Request failed with status ${response.status}`);

  return response.json() as Promise<T>;
}

export const handshakeService =
{
  // Current state of the handshake between a listing and a client
  get(listingId: number, clientId: number): Promise<Handshake>
  {
    return request(`/listings/${listingId}/handshakes/${clientId}`);
  },

  // The user says yes: the first yes makes it pending, the second confirms it
  approve(listingId: number, clientId: number): Promise<Handshake>
  {
    return request(`/listings/${listingId}/handshakes/${clientId}/approve`, 'POST');
  },

  // The listing a chat is about, or null when the chat has none
  async getForConversation(conversationId: number): Promise<ChatListing | null>
  {
    const data = await request<{ listing: ChatListing | null }>(`/conversations/${conversationId}/handshake`);
    return data.listing;
  }
};
