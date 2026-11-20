// The JSON shapes the friends routes send back. Keep them identical to the
// types in the frontend friend service.
//
// We never send the User row itself: it contains passwordHash, contact and the
// CIN. Only the fields below leave the server.

// The relation between the logged-in user and another user, from the logged-in
// user's point of view:
//   none             -> strangers: show "Add friend"
//   pending_sent     -> I asked them: show "Request sent" (cancel)
//   pending_received -> they asked me: show "Accept" / "Reject"
//   friends          -> show "Friends" (remove)
export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

// The public part of a user.
export class FriendUserDto {
  id!: number;
  firstName!: string;
  lastName!: string;
}

// Answer of GET /friends/:userId/status and of every action route, so the
// button can update itself without another request.
export class FriendshipStatusDto {
  status!: FriendshipStatus;
}

// One person in my friends list. `since` is when the friendship was accepted.
export class FriendDto {
  user!: FriendUserDto;
  since!: Date;
}

// One pending request. `user` is the OTHER person: the sender for an incoming
// request, the receiver for an outgoing one.
export class FriendRequestDto {
  user!: FriendUserDto;
  sentAt!: Date;
}

// Answer of GET /friends/requests.
export class FriendRequestsDto {
  incoming!: FriendRequestDto[];
  outgoing!: FriendRequestDto[];
}

// One result of GET /friends/search, with the status so the frontend can show
// the right button next to each name.
export class UserSearchResultDto {
  user!: FriendUserDto;
  status!: FriendshipStatus;
}
