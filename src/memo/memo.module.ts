import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemoController } from './memo.controller';
import { MemoService } from './services/memo.service';
import { MemoEntity } from 'src/entities/memo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MemoEntity])],
  controllers: [MemoController],
  providers: [MemoService],
})
export class MemoModule {}
