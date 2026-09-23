import { expect, it } from 'vitest';

it('provides a generated-project test runner', () => {
  expect(process.env.NODE_ENV).toBeDefined();
});
