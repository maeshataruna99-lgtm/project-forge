import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentIdentity, PermissionGuard, RequirePermission } from '../rbac/permission.guard';
import type { AuthIdentity } from '../auth/auth.service';
import { AuditService } from './audit.service';

@Controller('audit')
@UseGuards(AuthGuard, PermissionGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @RequirePermission('audit:read')
  list(@CurrentIdentity() identity: AuthIdentity) { return this.audit.list(identity); }
}
