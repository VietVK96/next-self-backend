import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactEntity } from 'src/entities/contact.entity';
import { FindContactController } from './find.contact.controller';
import { HistoricalController } from './historical.controller';
import { ContactService } from './services/contact.service';
import { FindContactService } from './services/find.contact.service';
import { HistoricalService } from './services/historical.service';
import { NoteService } from './services/note.service';
import { NoteController } from './ note.controller';
import { UserEntity } from 'src/entities/user.entity';
import { TraceabilityEntity } from 'src/entities/traceability.entity';
import { ActController } from './act.controller';
import { ActServices } from './services/act.service';
import { TaskService } from './services/task.service';
import { TaskController } from './task.controller';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';
import { UserModule } from 'src/user/userModule';
import { PatientModule } from 'src/patients/patient.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContactEntity,
      TraceabilityEntity,
      EventTaskEntity,
      ContactNoteEntity,
      UserEntity,
    ]),
    UserModule,
    PatientModule,
  ],
  controllers: [
    FindContactController,
    HistoricalController,
    ActController,
    TaskController,
    NoteController,
  ],
  providers: [
    FindContactService,
    HistoricalService,
    ContactService,
    NoteService,
    ActServices,
    TaskService,
  ],
  exports: [ContactService],
})
export class ContactModule {}
