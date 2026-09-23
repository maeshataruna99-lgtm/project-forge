import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { mergeMap, type Observable } from 'rxjs';
import type { AuthIdentity } from '../auth/auth.service';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthIdentity }>();
    const identity = request.user;
    const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
    return next.handle().pipe(mergeMap(async result => {
      if (identity && mutating) {
        await this.audit.record(identity, {
          action: `${request.method.toLowerCase()}.${request.route?.path ?? 'unknown'}`,
          targetType: request.baseUrl || 'api',
          metadata: { status: 'succeeded', body: request.body },
        });
      }
      return result;
    }));
  }
}
