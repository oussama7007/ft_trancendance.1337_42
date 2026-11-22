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

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  // my friends list
  @Get()
  getFriends(@Req() request: AuthenticatedRequest): Promise<FriendDto[]> {
    return this.friendsService.getFriends(request.user!.sub);
  }

  // requests i got and requests i sent
  @Get('requests')
  getRequests(@Req() request: AuthenticatedRequest): Promise<FriendRequestsDto> {
    return this.friendsService.getRequests(request.user!.sub);
  }

  // search users by name
  @Get('search')
  search(
    @Req() request: AuthenticatedRequest,
    @Query() query: SearchUsersDto,
  ): Promise<UserSearchResultDto[]> {
    return this.friendsService.searchUsers(request.user!.sub, query.q);
  }

  // my status with this user
  @Get(':userId/status')
  getStatus(
    @Req() request: AuthenticatedRequest,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<FriendshipStatusDto> {
    return this.friendsService.getStatus(request.user!.sub, userId);
  }

  // send a friend request
  @Post(':userId/request')
  sendRequest(
    @Req() request: AuthenticatedRequest,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<FriendshipStatusDto> {
    return this.friendsService.sendRequest(request.user!.sub, userId);
  }

  // accept a request
  @Post(':userId/accept')
  @HttpCode(HttpStatus.OK)
  acceptRequest(
    @Req() request: AuthenticatedRequest,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<FriendshipStatusDto> {
    return this.friendsService.acceptRequest(request.user!.sub, userId);
  }

  // reject a request
  @Post(':userId/reject')
  @HttpCode(HttpStatus.OK)
  rejectRequest(
    @Req() request: AuthenticatedRequest,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<FriendshipStatusDto> {
    return this.friendsService.rejectRequest(request.user!.sub, userId);
  }

  // cancel a request i sent
  @Delete(':userId/request')
  cancelRequest(
    @Req() request: AuthenticatedRequest,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<FriendshipStatusDto> {
    return this.friendsService.cancelRequest(request.user!.sub, userId);
  }

  // remove a friend
  @Delete(':userId')
  removeFriend(
    @Req() request: AuthenticatedRequest,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<FriendshipStatusDto> {
    return this.friendsService.removeFriend(request.user!.sub, userId);
  }
}
