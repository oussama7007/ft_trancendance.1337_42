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

// Postgres error codes we translate into clean HTTP answers.
const UNIQUE_VIOLATION = '23505'; // the pair already has a row
const FOREIGN_KEY_VIOLATION = '23503'; // the other user was deleted meanwhile

const SEARCH_LIMIT = 20;

// All the friendship rules and all the database work. `me` is always the
// logged-in user (taken from the JWT by the controller, never from the URL),
// `otherId` is always the person on the other side.
@Injectable()
export class FriendsService
{
  constructor(
    @InjectRepository(Friendship) private readonly friendshipRepository: Repository<Friendship>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  // ---------------------------------------------------------------- reading

  // My friends, most recent first.
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

  // The pending requests I received (incoming) and the ones I sent (outgoing).
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

  // Where I stand with one user. Used to choose which button to show.
  async getStatus(me: number, otherId: number): Promise<FriendshipStatusDto> {
    this.assertNotSelf(me, otherId);
    await this.assertUserExists(otherId);

    const row = await this.findPair(me, otherId);
    return { status: getFriendshipStatus(row, me) };
  }

  // Users whose name contains `text`, with my status for each one. This is how
  // you find someone to add: there is no page for other users' profiles yet.
  async searchUsers(me: number, text: string): Promise<UserSearchResultDto[]> {
    // The text goes in as a parameter (:pattern), never glued into the SQL,
    // so it cannot inject SQL. escapeLikePattern stops % and _ acting as
    // wildcards.
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

    // One query for all the statuses instead of one query per user.
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

  // ---------------------------------------------------------------- actions

  // I ask `otherId` to be my friend.
  async sendRequest(me: number, otherId: number): Promise<FriendshipStatusDto> {
    this.assertNotSelf(me, otherId);
    await this.assertUserExists(otherId);

    // Check first, to give a clear message for each case.
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
      // Two requests at the same moment (double click, or both users clicking
      // "Add" together): the unique pair index let only one row in.
      if (code === UNIQUE_VIOLATION) {
        const row = await this.findPair(me, otherId);
        this.throwAlreadyLinked(getFriendshipStatus(row, me));
      }
      // The other user was deleted between our check and the insert.
      if (code === FOREIGN_KEY_VIOLATION) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }

    return { status: 'pending_sent' };
  }

  // I accept the request `otherId` sent me.
  //
  // The WHERE does the security check: it only matches a row where THEY are
  // the requester, I am the addressee, and it is still pending. If I try to
  // accept my own request, or a request that was already answered, nothing
  // matches and I get 404.
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

  // I reject the request `otherId` sent me. The row is deleted: we become
  // strangers again, and either of us may send a new request later.
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

  // I take back the request I sent to `otherId`, before they answer.
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

  // I remove `otherId` from my friends. Either of the two friends may do it,
  // whoever sent the original request, so we look in both directions.
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

  // ---------------------------------------------------------------- helpers

  // The row between two users, in whichever direction it was created.
  private findPair(me: number, otherId: number): Promise<Friendship | null> {
    return this.friendshipRepository.findOne({
      where: [
        { requesterId: me, addresseeId: otherId },
        { requesterId: otherId, addresseeId: me },
      ],
    });
  }

  private assertNotSelf(me: number, otherId: number): void {
    if (me === otherId) {
      throw new BadRequestException('You cannot be friends with yourself');
    }
  }

  private async assertUserExists(userId: number): Promise<void> {
    const exists = await this.userRepository.existsBy({ id: userId });
    if (!exists) {
      throw new NotFoundException('User not found');
    }
  }

  // Explains why a new request is refused, depending on what already exists.
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
