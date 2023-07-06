import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { EventTaskService } from './services/event-task.service';
import { EventTaskController } from './event-task.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EventTaskEntity])],
  controllers: [EventTaskController],
  providers: [EventTaskService],
})
export class EventTaskModule {}
