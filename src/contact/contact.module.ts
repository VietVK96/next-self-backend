import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactEntity } from 'src/entities/contact.entity';
import { FindContactController } from './find.contact.controller';
import { HistoricalController } from './historical.controller';
import { ContactService } from './services/contact.service';
import { FindContactService } from './services/find.contact.service';
import { HistoricalService } from './services/historical.service';
import { ContactPaymentService } from './services/contact.payment.service';
import { ContactPaymentController } from './contact.payment.controller';
import { NoteService } from './services/note.service';
import { NoteController } from './note.controller';
import { UserEntity } from 'src/entities/user.entity';
import { TraceabilityEntity } from 'src/entities/traceability.entity';
import { ActController } from './act.controller';
import { ActServices } from './services/act.service';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';
import { TaskService } from './services/task.service';
import { TaskController } from './task.controller';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { UserModule } from 'src/user/user.module';
import { PatientModule } from 'src/patient/patient.module';
import { PermissionService } from 'src/user/services/permission.service';
import { FamilyController } from './family.controller';
import { FamilyService } from './services/family.service';
import { QuotationController } from './quotation.controller';
import { QuotationService } from './services/quotation.service';
import { DentalQuotationEntity } from 'src/entities/dental-quotation.entity';
import { CashingEntity } from 'src/entities/cashing.entity';
import { CashingContactEntity } from 'src/entities/cashing-contact.entity';

@Module({
  controllers: [
    FindContactController,
    HistoricalController,
    ContactPaymentController,
    ActController,
    TaskController,
    NoteController,
    FamilyController,
    QuotationController,
  ],
  providers: [
    FindContactService,
    HistoricalService,
    ContactService,
    ContactPaymentService,
    FindContactService,
    HistoricalService,
    ContactService,
    PatientModule,
    NoteService,
    ActServices,
    TaskService,
    PermissionService,
    FamilyService,
    QuotationService,
  ],
  imports: [
    TypeOrmModule.forFeature([
      ContactEntity,
      TraceabilityEntity,
      ContactNoteEntity,
      EventTaskEntity,
      UserEntity,
      DentalQuotationEntity,
      CashingEntity,
      CashingContactEntity,
    ]),
    UserModule,
    PatientModule,
  ],
  exports: [ContactService],
})
export class ContactModule {}
