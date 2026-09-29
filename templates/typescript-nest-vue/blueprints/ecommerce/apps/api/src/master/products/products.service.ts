import { Injectable } from '@nestjs/common';
import { starterProducts } from './product';

@Injectable()
export class ProductsService {
  list() {
    return starterProducts;
  }
}
