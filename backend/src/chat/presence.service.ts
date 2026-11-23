import { Injectable } from '@nestjs/common';

@Injectable()
export class PresenceService {
  private readonly sockets = new Map<number, Set<string>>();
  private readonly lastSeen = new Map<number, Date>();

  add(userId: number, socketId: string): boolean {
    const set = this.sockets.get(userId) ?? new Set<string>();
    const wasOffline = set.size === 0;
    set.add(socketId);
    this.sockets.set(userId, set);
    return wasOffline;
  }

  remove(userId: number, socketId: string): boolean {
    const set = this.sockets.get(userId);
    if (!set) return false;
    set.delete(socketId);
    if (set.size > 0) return false;
    this.sockets.delete(userId);
    this.lastSeen.set(userId, new Date());
    return true;
  }

  isOnline(userId: number): boolean {
    return (this.sockets.get(userId)?.size ?? 0) > 0;
  }

  getLastSeen(userId: number): Date | null {
    return this.lastSeen.get(userId) ?? null;
  }
}
