import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { PermissionGuard, RequirePermission } from '../../rbac/permission.guard';
import { ProductsService } from './products.service';

@Controller('products')
@UseGuards(AuthGuard, PermissionGuard)
export class ProductsController {
  constructor(@Inject(ProductsService) private readonly products: ProductsService) {}

  @Get()
  @RequirePermission('products:read')
  list() {
    return this.products.list();
  }
}
