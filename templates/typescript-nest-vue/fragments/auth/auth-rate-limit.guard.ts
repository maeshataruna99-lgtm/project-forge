import { CanActivate, Injectable, TooManyRequestsException, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 20;
const MAX_TRACKED_KEYS = 10_000;

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly attempts = new Map<string, { startedAt: number; count: number }>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const key = `${ip}:${request.route?.path ?? request.path}`;
    const now = Date.now();
    let current = this.attempts.get(key);
    if (!current || now - current.startedAt >= WINDOW_MS) {
      current = { startedAt: now, count: 0 };
      this.attempts.set(key, current);
    }
    if (current.count >= MAX_ATTEMPTS) throw new TooManyRequestsException('Too many authentication attempts. Try again later.');
    current.count += 1;
    if (this.attempts.size > MAX_TRACKED_KEYS) {
      for (const [trackedKey, entry] of this.attempts) {
        if (now - entry.startedAt >= WINDOW_MS) this.attempts.delete(trackedKey);
      }
    }
    return true;
  }
}
