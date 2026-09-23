import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionGuard, RequirePermission } from '../rbac/permission.guard';
import { ProductsService } from './products.service';

@Controller('products')
@UseGuards(AuthGuard, PermissionGuard)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @RequirePermission('products:read')
  list() {
    return this.products.list();
  }
}
