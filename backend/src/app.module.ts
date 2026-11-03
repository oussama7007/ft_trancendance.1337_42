import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';

import { ListingsModule } from './listings/listings.module.js';
import { ChatModule } from './chat/chat.module.js';
import { HandshakeModule } from './handshake/handshake.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'), 
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    AuthModule,
    ListingsModule,
    ChatModule,
    HandshakeModule,
    ReviewsModule
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}

