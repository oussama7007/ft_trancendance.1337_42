// same types as the frontend friendService
export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

export class FriendUserDto {
  id!: number;
  firstName!: string;
  lastName!: string;
}

export class FriendshipStatusDto {
  status!: FriendshipStatus;
}

export class FriendDto {
  user!: FriendUserDto;
  since!: Date;
}

export class FriendRequestDto {
  user!: FriendUserDto;
  sentAt!: Date;
}

export class FriendRequestsDto {
  incoming!: FriendRequestDto[];
  outgoing!: FriendRequestDto[];
}

export class UserSearchResultDto {
  user!: FriendUserDto;
  status!: FriendshipStatus;
}
