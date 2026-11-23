import { Injectable } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();

  private readonly requestCount = new Counter({
    name: 'http_requests_total',
    help: 'Number of HTTP requests the backend answered',
    labelNames: ['method', 'route', 'status'],
    registers: [this.registry],
  });

  private readonly requestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Time the backend took to answer an HTTP request',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [this.registry],
  });

  constructor() {
    collectDefaultMetrics({ register: this.registry });
  }

  recordRequest(
    method: string,
    route: string,
    status: number,
    seconds: number,
  ) {
    const labels = { method, route, status };

    this.requestCount.inc(labels);
    this.requestDuration.observe(labels, seconds);
  }

  readAllMetrics() {
    return this.registry.metrics();
  }
}
