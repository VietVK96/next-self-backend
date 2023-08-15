import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventController } from './event.controller';
import { FindEventService } from './services/find.event.service';
import { SaveEventService } from './services/save.event.service';
import { EventService } from './services/event.service';
import { PermissionService } from 'src/user/services/permission.service';
import { GetSessionService } from 'src/auth/services/get-session.service';
import { listEntities } from 'src/entities';

@Module({
  imports: [TypeOrmModule.forFeature(listEntities)],
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
