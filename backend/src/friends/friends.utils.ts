import type { User } from '../auth/user.entity.js';
import type { FriendUserDto, FriendshipStatus } from './dto/friend-response.dto.js';
import type { Friendship } from './entities/friendship.entity.js';

// gives the status of the row from the viewer side
export function getFriendshipStatus(row: Friendship | null, viewerId: number): FriendshipStatus {
  if (!row) {
    return 'none';
  }
  if (row.status === 'accepted') {
    return 'friends';
  }
  return row.requesterId === viewerId ? 'pending_sent' : 'pending_received';
}

// returns the other person in the row
export function getOtherUser(row: Friendship, viewerId: number): User {
  return row.requesterId === viewerId ? row.addressee : row.requester;
}

// keeps only the public fields of a user
export function toFriendUser(user: User): FriendUserDto {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

// escapes % _ and \ for ilike
export function escapeLikePattern(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}
