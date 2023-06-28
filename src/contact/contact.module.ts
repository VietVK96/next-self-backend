import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactEntity } from 'src/entities/contact.entity';
import { FindContactController } from './find.contact.controller';
import { HistoricalController } from './historical.controller';
import { ContactService } from './services/contact.service';
import { FindContactService } from './services/find.contact.service';
import { HistoricalService } from './services/historical.service';
import { ActController } from './act.controller';
import { ActServices } from './services/act.service';
import { TraceabilityEntity } from 'src/entities/traceability.entity';
import { TaskService } from './services/task.service';
import { TaskController } from './task.controller';
import { EventTaskEntity } from 'src/entities/event-task.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContactEntity,
      TraceabilityEntity,
      EventTaskEntity,
    ]),
  ],
  controllers: [
    FindContactController,
    HistoricalController,
    ActController,
    TaskController,
  ],
  providers: [
    FindContactService,
    HistoricalService,
    ContactService,
    ActServices,
    TaskService,
  ],
})
export class ContactModule {}
