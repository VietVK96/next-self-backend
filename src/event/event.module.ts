import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEntity } from 'src/entities/event.entity';
import { EventController } from './event.controller';
import { FindEventService } from './services/find.event.service';
import { SaveEventService } from './services/save.event.service';
import { ContactEntity } from 'src/entities/contact.entity';
import { EventOccurrenceEntity } from 'src/entities/event-occurrence.entity';
import { PlanEventEntity } from 'src/entities/plan-event.entity';
import { UserEntity } from 'src/entities/user.entity';
import { EventService } from './services/event.service';
import { PermissionService } from 'src/user/services/permission.service';
import { GetSessionService } from 'src/auth/services/get-session.service';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventEntity,
      EventOccurrenceEntity,
      ContactEntity,
      UserEntity,
      PlanEventEntity,
      UserMedicalEntity,
    ]),
  ],
  controllers: [EventController],
  providers: [
    FindEventService,
    SaveEventService,
    EventService,
    PermissionService,
    GetSessionService,
  ],
})
export class EventModule {}
