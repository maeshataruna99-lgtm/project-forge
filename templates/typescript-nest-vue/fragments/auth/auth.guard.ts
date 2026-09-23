import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, type AuthIdentity } from './auth.service';

type AuthenticatedRequest = Request & { user?: AuthIdentity };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    const identity = scheme === 'Bearer' && token ? this.auth.verifyAccess(token) : null;
    if (!identity) throw new UnauthorizedException('A valid access token is required');
    request.user = identity;
    return true;
  }
}
