import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: +process.env.REDIS_PORT || 6379,
  db: +process.env.REDIS_DB || 0,
}));

export interface RedisInterface {
  host: string;
  port: number;
  db: number;
}
