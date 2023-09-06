import { Injectable } from '@nestjs/common';
import { BullOptionsFactory } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { IRedisConfig } from './redis.config';

@Injectable()
export class BullConfigService implements BullOptionsFactory {
  constructor(private configService: ConfigService) {}

  public async createBullOptions() {
    const config = this.configService.get<IRedisConfig>('redis');
    return {
      redis: {
        host: config.host,
        port: config.port,
        password: config.password,
        username: config.username,
      },
    };
  }
}
