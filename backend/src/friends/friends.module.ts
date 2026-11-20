import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { User } from '../auth/user.entity.js';
import { Friendship } from './entities/friendship.entity.js';
import { FriendsController } from './friends.controller.js';
import { FriendsService } from './friends.service.js';

// Groups everything about friends: the table, the routes and the logic.
// - TypeOrmModule.forFeature gives the service access to the friendships and
//   user tables (the user table to check that someone exists and to search).
// - AuthModule shares the JWT tools that JwtAuthGuard needs.
@Module({
  imports: [TypeOrmModule.forFeature([Friendship, User]), AuthModule],
  controllers: [FriendsController],
  providers: [FriendsService],
})
export class FriendsModule {}
