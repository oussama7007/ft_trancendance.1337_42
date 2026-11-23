import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { User } from '../auth/user.entity.js';
import { Friendship } from './entities/friendship.entity.js';
import { FriendsController } from './friends.controller.js';
import { FriendsService } from './friends.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Friendship, User]), AuthModule],
  controllers: [FriendsController],
  providers: [FriendsService],
})
export class FriendsModule {}
