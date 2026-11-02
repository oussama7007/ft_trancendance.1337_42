export type HandshakeStatus = 'none' | 'pending' | 'confirmed';

// A handshake as the person asking sees it. Mirrors HandshakeResponseDto in the backend.
export interface Handshake
{
  status: HandshakeStatus;
  hasUserApproved: boolean;
}

// Sends one request to the handshake API and returns the handshake it answers with.
//
// TODO(auth): `userId` goes in the query string only because login does not
// exist yet and the backend cannot tell who is calling. Once the JWT is
// available, drop it here and in the hook and button that carry it.
async function request(url: string, method: 'GET' | 'POST', userId: number): Promise<Handshake>
{
  const response = await fetch(`/api${url}?userId=${userId}`, { method });

  if (!response.ok)
    throw new Error(`Request failed with status ${response.status}`);

  return response.json() as Promise<Handshake>;
}

export const handshakeService =
{
  // Current state of the handshake between a listing and a client.
  get(listingId: number, clientId: number, userId: number): Promise<Handshake>
  {
    return request(`/listings/${listingId}/handshakes/${clientId}`, 'GET', userId);
  },

  // The user says yes: the first yes makes it pending, the second confirms it.
  approve(listingId: number, clientId: number, userId: number): Promise<Handshake>
  {
    return request(`/listings/${listingId}/handshakes/${clientId}/approve`, 'POST', userId);
  }
};
