import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RequirePermission, PermissionGuard } from './permission.guard';

@Controller('projects')
@UseGuards(AuthGuard, PermissionGuard)
export class ProjectsController {
  @Get()
  @RequirePermission('projects:read')
  list() { return [{ id: 'example', title: 'Example project' }]; }

  @Post()
  @RequirePermission('projects:write')
  create() { return { id: 'new-example', title: 'New project' }; }
}
