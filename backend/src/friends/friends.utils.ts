import type { User } from '../auth/user.entity.js';
import type { FriendUserDto, FriendshipStatus } from './dto/friend-response.dto.js';
import type { Friendship } from './entities/friendship.entity.js';

// Pure helpers: no database here, which keeps the rules easy to test
// (friends.utils.spec.ts).

// Turns the stored row into the status `viewerId` should see.
// A missing row (null) means the two users are strangers.
export function getFriendshipStatus(row: Friendship | null, viewerId: number): FriendshipStatus {
  if (!row) {
    return 'none';
  }
  if (row.status === 'accepted') {
    return 'friends';
  }
  return row.requesterId === viewerId ? 'pending_sent' : 'pending_received';
}

// In a row about me, returns the other person.
export function getOtherUser(row: Friendship, viewerId: number): User {
  return row.requesterId === viewerId ? row.addressee : row.requester;
}

// Keeps only the public fields of a user. Never send the whole User row.
export function toFriendUser(user: User): FriendUserDto {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

// Makes `%`, `_` and `\` lose their special meaning in an ILIKE pattern, so a
// search for "50%" looks for the text "50%", not "50 followed by anything".
export function escapeLikePattern(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}
