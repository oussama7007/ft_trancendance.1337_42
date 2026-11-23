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

// fetch with the login cookie
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

// runs an action and returns the new status
async function changeStatus(path: string, method: string): Promise<FriendshipStatus>
{
  const data = await request<{ status: FriendshipStatus }>(path, method);
  return data.status;
}

// my friends
export function getFriends()
{
  return request<Friend[]>('');
}

// my requests
export function getRequests()
{
  return request<FriendRequests>('/requests');
}

// search by name
export function searchUsers(text: string)
{
  return request<SearchResult[]>(`/search?q=${encodeURIComponent(text)}`);
}

// send a request
export function sendRequest(userId: number)
{
  return changeStatus(`/${userId}/request`, 'POST');
}

// accept a request
export function acceptRequest(userId: number)
{
  return changeStatus(`/${userId}/accept`, 'POST');
}

// reject a request
export function rejectRequest(userId: number)
{
  return changeStatus(`/${userId}/reject`, 'POST');
}

// cancel my request
export function cancelRequest(userId: number)
{
  return changeStatus(`/${userId}/request`, 'DELETE');
}

// remove a friend
export function removeFriend(userId: number)
{
  return changeStatus(`/${userId}`, 'DELETE');
}
