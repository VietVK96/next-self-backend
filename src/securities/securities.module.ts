import { Module } from '@nestjs/common';
import { SecuritiesService } from './securities.service';
import { SecuritiesController } from './securities.controller';
import { UserEntity } from 'src/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [SecuritiesController],
  providers: [SecuritiesService],
})
export class SecuritiesModule {}
