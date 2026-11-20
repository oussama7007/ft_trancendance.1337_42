import { ApiError } from '../api/apiError';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

export interface FriendUser
{
  id: number;
  firstName: string;
  lastName: string;
}

export interface Friend
{
  user: FriendUser;
  since: string;
}

export interface FriendRequest
{
  user: FriendUser;
  sentAt: string;
}

export interface FriendRequests
{
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

export interface SearchResult
{
  user: FriendUser;
  status: FriendshipStatus;
}

// Calls the friends api with the login cookie and returns the json
async function request<T>(path: string, method = 'GET'): Promise<T>
{
  const response = await fetch(`${API_URL}/friends${path}`, {
    method,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return response.json();
}

// Runs a friend action and gives back the new status
async function changeStatus(path: string, method: string): Promise<FriendshipStatus>
{
  const data = await request<{ status: FriendshipStatus }>(path, method);
  return data.status;
}

// Gets my friends list
export function getFriends()
{
  return request<Friend[]>('');
}

// Gets the requests i received and the ones i sent
export function getRequests()
{
  return request<FriendRequests>('/requests');
}

// Finds users by name
export function searchUsers(text: string)
{
  return request<SearchResult[]>(`/search?q=${encodeURIComponent(text)}`);
}

// Sends a friend request
export function sendRequest(userId: number)
{
  return changeStatus(`/${userId}/request`, 'POST');
}

// Accepts a request this user sent me
export function acceptRequest(userId: number)
{
  return changeStatus(`/${userId}/accept`, 'POST');
}

// Rejects a request this user sent me
export function rejectRequest(userId: number)
{
  return changeStatus(`/${userId}/reject`, 'POST');
}

// Cancels the request i sent to this user
export function cancelRequest(userId: number)
{
  return changeStatus(`/${userId}/request`, 'DELETE');
}

// Removes this user from my friends
export function removeFriend(userId: number)
{
  return changeStatus(`/${userId}`, 'DELETE');
}
