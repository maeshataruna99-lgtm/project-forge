import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class QueueService {
  constructor(private readonly redis: RedisService) {}

  async enqueue(payload: Record<string, unknown>) {
    const job = { id: randomUUID(), createdAt: new Date().toISOString(), payload };
    await this.redis.enqueue('jobs', JSON.stringify(job));
    return { id: job.id, queued: true };
  }
}
