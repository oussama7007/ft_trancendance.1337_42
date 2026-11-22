import type { Language } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type HandshakeStatus = 'none' | 'pending' | 'confirmed';

// same as HandshakeResponseDto
export interface Handshake
{
  status: HandshakeStatus;
  hasUserApproved: boolean;
}

// same as ChatHandshakeDto
export interface ChatListing
{
  id: number;
  clientId: number;
  title: Record<Language, string>;
}

// fetch with the login cookie
async function request<T>(url: string, method: 'GET' | 'POST' = 'GET'): Promise<T>
{
  const response = await fetch(`${API_URL}${url}`, { method, credentials: 'include' });

  if (!response.ok)
    throw new Error(`Request failed with status ${response.status}`);

  return response.json() as Promise<T>;
}

export const handshakeService =
{
  // gets the handshake
  get(listingId: number, clientId: number): Promise<Handshake>
  {
    return request(`/listings/${listingId}/handshakes/${clientId}`);
  },

  // says yes
  approve(listingId: number, clientId: number): Promise<Handshake>
  {
    return request(`/listings/${listingId}/handshakes/${clientId}/approve`, 'POST');
  },

  // gets the listing of a chat
  async getForConversation(conversationId: number): Promise<ChatListing | null>
  {
    const data = await request<{ listing: ChatListing | null }>(`/conversations/${conversationId}/handshake`);
    return data.listing;
  }
};
