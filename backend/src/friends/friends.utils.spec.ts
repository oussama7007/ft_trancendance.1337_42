import type { User } from '../auth/user.entity.js';
import type { Friendship } from './entities/friendship.entity.js';
import {
  escapeLikePattern,
  getFriendshipStatus,
  getOtherUser,
  toFriendUser,
} from './friends.utils.js';

// Unit tests for the rules in friends.utils.ts. They need no database.
// Story used everywhere: Sara (4) sent a friend request to Youssef (9).
const SARA = 4;
const YOUSSEF = 9;

function makeUser(id: number, firstName: string): User {
  return {
    id,
    firstName,
    lastName: 'Test',
    passwordHash: 'secret-hash',
    email: `${firstName}@mail.com`,
  } as User;
}

function makeRow(status: 'pending' | 'accepted'): Friendship {
  return {
    requesterId: SARA,
    addresseeId: YOUSSEF,
    status,
    requester: makeUser(SARA, 'Sara'),
    addressee: makeUser(YOUSSEF, 'Youssef'),
  } as Friendship;
}

describe('getFriendshipStatus', () => {
  it('is none when there is no row', () => {
    expect(getFriendshipStatus(null, SARA)).toBe('none');
  });

  it('is pending_sent for the user who sent the request', () => {
    expect(getFriendshipStatus(makeRow('pending'), SARA)).toBe('pending_sent');
  });

  it('is pending_received for the user who received it', () => {
    expect(getFriendshipStatus(makeRow('pending'), YOUSSEF)).toBe('pending_received');
  });

  it('is friends for both users once accepted', () => {
    expect(getFriendshipStatus(makeRow('accepted'), SARA)).toBe('friends');
    expect(getFriendshipStatus(makeRow('accepted'), YOUSSEF)).toBe('friends');
  });
});

describe('getOtherUser', () => {
  it('returns the addressee when I am the requester, and the opposite', () => {
    expect(getOtherUser(makeRow('accepted'), SARA).id).toBe(YOUSSEF);
    expect(getOtherUser(makeRow('accepted'), YOUSSEF).id).toBe(SARA);
  });
});

describe('toFriendUser', () => {
  it('keeps only the public fields', () => {
    expect(toFriendUser(makeUser(SARA, 'Sara'))).toEqual({
      id: SARA,
      firstName: 'Sara',
      lastName: 'Test',
    });
  });
});

describe('escapeLikePattern', () => {
  it('escapes the ILIKE special characters', () => {
    expect(escapeLikePattern('50%_a\\b')).toBe('50\\%\\_a\\\\b');
  });

  it('leaves normal text alone', () => {
    expect(escapeLikePattern('sara')).toBe('sara');
  });
});
