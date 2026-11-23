import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../auth/user.entity.js';
import {
  FriendDto,
  FriendRequestsDto,
  FriendshipStatus,
  FriendshipStatusDto,
  UserSearchResultDto,
} from './dto/friend-response.dto.js';
import { Friendship } from './entities/friendship.entity.js';
import {
  escapeLikePattern,
  getFriendshipStatus,
  getOtherUser,
  toFriendUser,
} from './friends.utils.js';

// postgres error codes
const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';

const SEARCH_LIMIT = 20;

@Injectable()
export class FriendsService
{
  constructor(
    @InjectRepository(Friendship) private readonly friendshipRepository: Repository<Friendship>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  // my friends newest first
  async getFriends(me: number): Promise<FriendDto[]> {
    const rows = await this.friendshipRepository.find({
      where: [
        { requesterId: me, status: 'accepted' },
        { addresseeId: me, status: 'accepted' },
      ],
      relations: { requester: true, addressee: true },
      order: { updatedAt: 'DESC' },
    });

    return rows.map((row) => ({
      user: toFriendUser(getOtherUser(row, me)),
      since: row.updatedAt,
    }));
  }

  // pending requests i got and i sent
  async getRequests(me: number): Promise<FriendRequestsDto> {
    const rows = await this.friendshipRepository.find({
      where: [
        { addresseeId: me, status: 'pending' },
        { requesterId: me, status: 'pending' },
      ],
      relations: { requester: true, addressee: true },
      order: { createdAt: 'DESC' },
    });

    const toRequest = (row: Friendship) => ({
      user: toFriendUser(getOtherUser(row, me)),
      sentAt: row.createdAt,
    });

    return {
      incoming: rows.filter((row) => row.addresseeId === me).map(toRequest),
      outgoing: rows.filter((row) => row.requesterId === me).map(toRequest),
    };
  }

  // my status with one user
  async getStatus(me: number, otherId: number): Promise<FriendshipStatusDto> {
    this.assertNotSelf(me, otherId);
    await this.assertUserExists(otherId);

    const row = await this.findPair(me, otherId);
    return { status: getFriendshipStatus(row, me) };
  }

  // finds users by name with my status for each
  async searchUsers(me: number, text: string): Promise<UserSearchResultDto[]> {
    const users = await this.userRepository
      .createQueryBuilder('u')
      .where('u.id <> :me', { me })
      .andWhere(`("u"."firstName" || ' ' || "u"."lastName") ILIKE :pattern`, {
        pattern: `%${escapeLikePattern(text)}%`,
      })
      .orderBy('u.firstName', 'ASC')
      .addOrderBy('u.lastName', 'ASC')
      .limit(SEARCH_LIMIT)
      .getMany();

    if (users.length === 0) {
      return [];
    }

    const ids = users.map((user) => user.id);
    const rows = await this.friendshipRepository.find({
      where: [
        { requesterId: me, addresseeId: In(ids) },
        { requesterId: In(ids), addresseeId: me },
      ],
    });

    return users.map((user) => {
      const row = rows.find((r) => r.requesterId === user.id || r.addresseeId === user.id) ?? null;
      return { user: toFriendUser(user), status: getFriendshipStatus(row, me) };
    });
  }

  // sends a friend request
  async sendRequest(me: number, otherId: number): Promise<FriendshipStatusDto> {
    this.assertNotSelf(me, otherId);
    await this.assertUserExists(otherId);

    const existing = await this.findPair(me, otherId);
    if (existing) {
      this.throwAlreadyLinked(getFriendshipStatus(existing, me));
    }

    try {
      await this.friendshipRepository.insert({
        requesterId: me,
        addresseeId: otherId,
        status: 'pending',
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      // both clicked at the same time
      if (code === UNIQUE_VIOLATION) {
        const row = await this.findPair(me, otherId);
        this.throwAlreadyLinked(getFriendshipStatus(row, me));
      }
      if (code === FOREIGN_KEY_VIOLATION) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }

    return { status: 'pending_sent' };
  }

  // accepts a request they sent me
  async acceptRequest(me: number, otherId: number): Promise<FriendshipStatusDto> {
    const result = await this.friendshipRepository.update(
      { requesterId: otherId, addresseeId: me, status: 'pending' },
      { status: 'accepted' },
    );
    if (!result.affected) {
      throw new NotFoundException('No pending friend request from this user');
    }
    return { status: 'friends' };
  }

  // rejects a request they sent me
  async rejectRequest(me: number, otherId: number): Promise<FriendshipStatusDto> {
    const result = await this.friendshipRepository.delete({
      requesterId: otherId,
      addresseeId: me,
      status: 'pending',
    });
    if (!result.affected) {
      throw new NotFoundException('No pending friend request from this user');
    }
    return { status: 'none' };
  }

  // cancels a request i sent
  async cancelRequest(me: number, otherId: number): Promise<FriendshipStatusDto> {
    const result = await this.friendshipRepository.delete({
      requesterId: me,
      addresseeId: otherId,
      status: 'pending',
    });
    if (!result.affected) {
      throw new NotFoundException('No pending friend request to this user');
    }
    return { status: 'none' };
  }

  // removes a friend
  async removeFriend(me: number, otherId: number): Promise<FriendshipStatusDto> {
    const result = await this.friendshipRepository
      .createQueryBuilder()
      .delete()
      .where('status = :status', { status: 'accepted' })
      .andWhere(
        '((requester_id = :me AND addressee_id = :otherId) OR (requester_id = :otherId AND addressee_id = :me))',
        { me, otherId },
      )
      .execute();
    if (!result.affected) {
      throw new NotFoundException('This user is not your friend');
    }
    return { status: 'none' };
  }

  // finds the row between two users
  private findPair(me: number, otherId: number): Promise<Friendship | null> {
    return this.friendshipRepository.findOne({
      where: [
        { requesterId: me, addresseeId: otherId },
        { requesterId: otherId, addresseeId: me },
      ],
    });
  }

  // stops adding yourself
  private assertNotSelf(me: number, otherId: number): void {
    if (me === otherId) {
      throw new BadRequestException('You cannot be friends with yourself');
    }
  }

  // 404 if the user does not exist
  private async assertUserExists(userId: number): Promise<void> {
    const exists = await this.userRepository.existsBy({ id: userId });
    if (!exists) {
      throw new NotFoundException('User not found');
    }
  }

  // throws the right 409 message
  private throwAlreadyLinked(status: FriendshipStatus): never {
    if (status === 'friends') {
      throw new ConflictException('You are already friends');
    }
    if (status === 'pending_received') {
      throw new ConflictException('This user already sent you a request, accept it instead');
    }
    throw new ConflictException('You already sent a request to this user');
  }
}
