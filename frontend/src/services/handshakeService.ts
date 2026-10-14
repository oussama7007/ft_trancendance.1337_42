export type HandshakeStatus = 'none' | 'pending' | 'confirmed';

// State of a handshake, seen from the logged-in user's side
export interface Handshake
{
  status: HandshakeStatus;
  hasUserApproved: boolean;
}

async function request(url: string, method: 'GET' | 'POST'): Promise<Handshake>
{
  const response = await fetch(`/api${url}`, { method });

  if (!response.ok)
    throw new Error(`Request failed with status ${response.status}`);

  return response.json() as Promise<Handshake>;
}

export const handshakeService =
{
  // Current state of the handshake between a listing and a client
  get(listingId: number, clientId: number): Promise<Handshake>
  {
    return request(`/listings/${listingId}/handshakes/${clientId}`, 'GET');
  },

  // The logged-in user says yes (first yes -> pending, second yes -> confirmed)
  approve(listingId: number, clientId: number): Promise<Handshake>
  {
    return request(`/listings/${listingId}/handshakes/${clientId}/approve`, 'POST');
  },
};
