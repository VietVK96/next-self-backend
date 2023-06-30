import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEntity } from 'src/entities/event.entity';
import { EventController } from './event.controller';
import { FindEventService } from './services/find.event.service';
import { SaveEventService } from './services/save.event.service';

@Module({
  imports: [TypeOrmModule.forFeature([EventEntity])],
  controllers: [EventController],
  providers: [FindEventService, SaveEventService],
})
export class EventModule {}
