import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import {
  FriendDto,
  FriendRequestsDto,
  FriendshipStatusDto,
  UserSearchResultDto,
} from './dto/friend-response.dto.js';
import { SearchUsersDto } from './dto/search-users.dto.js';
import { FriendsService } from './friends.service.js';

// The friends routes. This class only maps URLs to service methods; every
// rule lives in FriendsService.
//
// Security: JwtAuthGuard runs before every route. It reads the login cookie,
// answers 401 if it is missing or fake, and puts the user's id in
// request.user.sub. "Me" always comes from there, never from the URL or the
// body, so nobody can act in someone else's name.
//
// :userId is always the OTHER user. ParseIntPipe answers 400 if it is not a
// number.
@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  // GET /friends -> my friends list
  @Get()
  getFriends(@Req() request: AuthenticatedRequest): Promise<FriendDto[]> {
    return this.friendsService.getFriends(request.user!.sub);
  }

  // GET /friends/requests -> { incoming, outgoing } pending requests
  @Get('requests')
  getRequests(@Req() request: AuthenticatedRequest): Promise<FriendRequestsDto> {
    return this.friendsService.getRequests(request.user!.sub);
  }

  // GET /friends/search?q=sara -> users matching the name, with my status
  @Get('search')
  search(
    @Req() request: AuthenticatedRequest,
    @Query() query: SearchUsersDto,
  ): Promise<UserSearchResultDto[]> {
    return this.friendsService.searchUsers(request.user!.sub, query.q);
  }

  // GET /friends/:userId/status -> where I stand with this user
  @Get(':userId/status')
  getStatus(
    @Req() request: AuthenticatedRequest,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<FriendshipStatusDto> {
    return this.friendsService.getStatus(request.user!.sub, userId);
  }

  // POST /friends/:userId/request -> send a request (201 Created: a new row)
  @Post(':userId/request')
  sendRequest(
    @Req() request: AuthenticatedRequest,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<FriendshipStatusDto> {
    return this.friendsService.sendRequest(request.user!.sub, userId);
  }

  // POST /friends/:userId/accept -> accept their request (200: a row changed)
  @Post(':userId/accept')
  @HttpCode(HttpStatus.OK)
  acceptRequest(
    @Req() request: AuthenticatedRequest,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<FriendshipStatusDto> {
    return this.friendsService.acceptRequest(request.user!.sub, userId);
  }

  // POST /friends/:userId/reject -> reject their request
  @Post(':userId/reject')
  @HttpCode(HttpStatus.OK)
  rejectRequest(
    @Req() request: AuthenticatedRequest,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<FriendshipStatusDto> {
    return this.friendsService.rejectRequest(request.user!.sub, userId);
  }

  // DELETE /friends/:userId/request -> cancel the request I sent
  @Delete(':userId/request')
  cancelRequest(
    @Req() request: AuthenticatedRequest,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<FriendshipStatusDto> {
    return this.friendsService.cancelRequest(request.user!.sub, userId);
  }

  // DELETE /friends/:userId -> remove this friend
  @Delete(':userId')
  removeFriend(
    @Req() request: AuthenticatedRequest,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<FriendshipStatusDto> {
    return this.friendsService.removeFriend(request.user!.sub, userId);
  }
}
