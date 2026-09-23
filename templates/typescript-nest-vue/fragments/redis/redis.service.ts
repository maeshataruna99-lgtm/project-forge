import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

export function redisKey(namespace: string, key: string): string {
  return `${namespace}:${key}`;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client = new Redis(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379', { lazyConnect: true, maxRetriesPerRequest: 2 });

  async ping() {
    if (this.client.status === 'wait') await this.client.connect();
    return this.client.ping();
  }

  async enqueue(queue: string, payload: string) {
    return this.client.lpush(redisKey('project-forge', queue), payload);
  }

  async onModuleDestroy() {
    if (this.client.status !== 'end') await this.client.quit();
  }
}
