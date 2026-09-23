import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PermissionGuard } from './permission.guard';
import { ProjectsController } from './projects.controller';

@Module({ imports: [AuthModule], controllers: [ProjectsController], providers: [PermissionGuard], exports: [PermissionGuard] })
export class RbacModule {}
