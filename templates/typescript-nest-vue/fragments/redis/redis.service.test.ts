import { expect, it } from 'vitest';
import { redisKey } from './redis.service';

it('keeps Redis keys separated by the Project Forge namespace', () => {
  expect(redisKey('project-forge', 'jobs')).toBe('project-forge:jobs');
});
