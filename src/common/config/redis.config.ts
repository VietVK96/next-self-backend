import { registerAs } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || '10.10.31.29',
  port: +process.env.REDIS_PORT || 6379,
  db: +process.env.REDIS_DB || 0,
  store: redisStore,
  ttl: 600,
  isGlobal: true,
}));

export interface RedisInterface {
  host: string;
  port: number;
  db: number;
}
