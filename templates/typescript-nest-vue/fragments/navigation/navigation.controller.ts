import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentIdentity } from '../rbac/permission.guard';
import type { AuthIdentity } from '../auth/auth.service';
import { NavigationService } from './navigation.service';

@Controller('navigation')
@UseGuards(AuthGuard)
export class NavigationController {
  constructor(private readonly navigation: NavigationService) {}

  @Get()
  list(@CurrentIdentity() identity: AuthIdentity) { return this.navigation.list(identity); }
}
