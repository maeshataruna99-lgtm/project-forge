import { expect, it } from 'vitest';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

it('returns a stable starter catalog with safe integer prices', () => {
  const result = new ProductsController(new ProductsService()).list();
  expect(result.length).toBeGreaterThan(0);
  expect(result.every(product => Number.isSafeInteger(product.priceCents) && product.priceCents >= 0)).toBe(true);
});
