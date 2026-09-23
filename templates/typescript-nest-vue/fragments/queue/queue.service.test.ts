import { expect, it, vi } from 'vitest';
import { QueueService } from './queue.service';

it('serializes a generated queue job and reports its identifier', async () => {
  const enqueue = vi.fn(async () => 1);
  const queue = new QueueService({ enqueue } as never);
  const result = await queue.enqueue({ type: 'example' });
  expect(result).toMatchObject({ queued: true });
  expect(enqueue).toHaveBeenCalledWith('jobs', expect.stringContaining('"type":"example"'));
});
