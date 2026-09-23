import { expect, it } from 'vitest';
import { HttpException, HttpStatus, type ExecutionContext } from '@nestjs/common';
import { ApiRateLimitGuard } from './api-rate-limit.guard';

it('returns HTTP 429 after the per-IP request limit', () => {
  const guard = new ApiRateLimitGuard();
  const request = { ip: '127.0.0.1', socket: {} };
  const context = { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
  for (let index = 0; index < 120; index += 1) expect(guard.canActivate(context)).toBe(true);
  try { guard.canActivate(context); throw new Error('Expected a limit response'); }
  catch (error) { expect(error).toBeInstanceOf(HttpException); expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS); }
});
