import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { MetricsService } from './metrics.service.js';

@Injectable()
export class RequestMetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(request: Request, response: Response, next: NextFunction) {
    const startedAt = Date.now();

    response.on('finish', () => {
      const seconds = (Date.now() - startedAt) / 1000;

      this.metricsService.recordRequest(
        request.method,
        routeOf(request),
        response.statusCode,
        seconds,
      );
    });

    next();
  }
}

function routeOf(request: Request): string {
  const route = request.route as { path?: string } | undefined;

  return route?.path ?? 'unknown';
}
