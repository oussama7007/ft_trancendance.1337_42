import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MetricsController } from './metrics.controller.js';
import { MetricsService } from './metrics.service.js';
import { RequestMetricsMiddleware } from './request-metrics.middleware.js';

@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
})
export class MetricsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestMetricsMiddleware).exclude('metrics').forRoutes('*');
  }
}
