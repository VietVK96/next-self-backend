import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BcbServices } from './services/bcb.services';
import { BcbController } from './bcb.controller';
import { UserEntity } from 'src/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [BcbController],
  exports: [BcbServices],
  providers: [BcbServices],
})
export class BcbModule {}
