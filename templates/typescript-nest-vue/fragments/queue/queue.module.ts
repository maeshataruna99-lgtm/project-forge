import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';

@Module({ imports: [RedisModule], controllers: [QueueController], providers: [QueueService] })
export class QueueModule {}
