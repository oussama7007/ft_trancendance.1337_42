import { Module } from '@nestjs/common';
import { RoommatesController } from './roommates.controller.js';
import { RoommatesService } from './roommates.service.js';

@Module({
  controllers: [RoommatesController],
  providers: [RoommatesService],
})
export class RoommatesModule {}
