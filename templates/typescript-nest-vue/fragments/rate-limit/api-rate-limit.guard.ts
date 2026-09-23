import { CanActivate, HttpException, HttpStatus, Injectable, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;

@Injectable()
export class ApiRateLimitGuard implements CanActivate {
  private readonly clients = new Map<string, { startedAt: number; count: number }>();

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const current = this.clients.get(ip);
    if (!current || now - current.startedAt >= WINDOW_MS) {
      if (this.clients.size > 10_000) this.clients.clear();
      this.clients.set(ip, { startedAt: now, count: 1 });
      return true;
    }
    if (current.count >= MAX_REQUESTS) throw new HttpException('Request limit exceeded. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    current.count += 1;
    return true;
  }
}
