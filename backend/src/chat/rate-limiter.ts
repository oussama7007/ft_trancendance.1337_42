export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

  tryConsume(key: string | number): boolean {
    const now = Date.now();
    const id = String(key);
    const recent = (this.hits.get(id) ?? []).filter((time) => now - time < this.windowMs);

    if (recent.length >= this.max) {
      this.hits.set(id, recent);
      return false;
    }

    recent.push(now);
    this.hits.set(id, recent);

    if (this.hits.size > 10_000) {
      for (const [otherKey, times] of this.hits) {
        if (times.every((time) => now - time >= this.windowMs)) this.hits.delete(otherKey);
      }
    }
    return true;
  }
}
