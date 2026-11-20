import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller.js';
import { ProfileService } from './profile.service.js';

import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../auth/user.entity.js';
import { AuthModule } from '../auth/auth.module.js';



@Module({
      imports: [
        TypeOrmModule.forFeature([User]),
        AuthModule,
    ],
  controllers: [ProfileController],
  providers: [ProfileService]
})



export class ProfileModule {}