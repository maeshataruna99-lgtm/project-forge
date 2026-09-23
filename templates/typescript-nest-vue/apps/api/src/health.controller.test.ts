import 'reflect-metadata';
import { expect, it } from 'vitest';
import { HealthController } from './health.controller';

it('reports API health', () => {
  expect(new HealthController().getHealth()).toEqual({ status: 'ok' });
});
