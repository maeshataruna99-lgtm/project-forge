import { CanActivate, createParamDecorator, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { hasPermission, type PermissionCode } from './permissions';
import type { AuthIdentity } from '../auth/auth.service';

const REQUIRED_PERMISSION = 'projectForge:requiredPermission';
export const RequirePermission = (permission: PermissionCode) => SetMetadata(REQUIRED_PERMISSION, permission);
export const CurrentIdentity = createParamDecorator((_data: unknown, context: ExecutionContext) =>
  context.switchToHttp().getRequest<Request & { user: AuthIdentity }>().user,
);

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<PermissionCode>(REQUIRED_PERMISSION, [context.getHandler(), context.getClass()]);
    if (!required) return true;
    const request = context.switchToHttp().getRequest<Request & { user?: AuthIdentity }>();
    if (!request.user || !hasPermission(request.user, required)) throw new ForbiddenException('The authenticated role lacks this permission');
    return true;
  }
}
