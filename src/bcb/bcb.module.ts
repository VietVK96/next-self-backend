import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BcbServices } from './services/bcb.services';
import { BcbController } from './bcb.controller';
import { UserEntity } from 'src/entities/user.entity';
import { ClaudeBernardService } from './services/claudeBernard.Service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), ConfigModule],
  controllers: [BcbController],
  exports: [BcbServices],
  providers: [BcbServices, ClaudeBernardService],
})
export class BcbModule {}
