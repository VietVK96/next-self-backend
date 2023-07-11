import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEntity } from 'src/entities/event.entity';
import { TrashEventController } from './trash.event.controller';
import { TrashEventService } from './service/trash.event.service';

@Module({
  imports: [TypeOrmModule.forFeature([EventEntity])],
  controllers: [TrashEventController],
  providers: [TrashEventService],
})
export class TrashEventModule {}
