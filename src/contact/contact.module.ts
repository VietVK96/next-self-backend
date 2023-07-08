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
import { PatientModule } from 'src/patient/patient.module';
import { PermissionService } from 'src/user/services/permission.service';
import { FamilyController } from './family.controller';
import { FamilyService } from './services/family.service';
import { QuotationController } from './quotation.controller';
import { QuotationService } from './services/quotation.service';
import { DentalQuotationEntity } from 'src/entities/dental-quotation.entity';
import { DentalModifierEntity } from 'src/entities/dental-modifier.entity';
import { CcamUnitPriceEntity } from 'src/entities/ccamunitprice.entity';
import { CcamEntity } from 'src/entities/ccam.entity';
import { UserModule } from 'src/user/user.module';
import { CashingEntity } from 'src/entities/cashing.entity';
import { CashingContactEntity } from 'src/entities/cashing-contact.entity';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { DocumentServices } from './services/document.service';
import { DocumentController } from './document.controller';
import { UploadService } from 'src/upload/services/upload.service';
import { UploadModule } from 'src/upload/upload.module';
import { UploadController } from 'src/upload/upload.controller';
import { OrganizationService } from 'src/organization/service/organization.service';
import { UploadEntity } from 'src/entities/upload.entity';
import { ContactDocumentEntity } from 'src/entities/contact-document.entity';
import { DentalEventTaskEntity } from 'src/entities/dental-event-task.entity';
import { SaveTaskService } from './services/save.task.service';
import { PatientAmoEntity } from 'src/entities/patient-amo.entity';
import { CorrespondentEntity } from 'src/entities/correspondent.entity';
import { BillController } from './bill.controller';
import { BillService } from './services/bill.service';
import { BillEntity } from 'src/entities/bill.entity';
import { MedicalOrderController } from './medicalOrder.controller';
import { MedicalOrderService } from './services/medicalOrder.service';
import { MedicalOrderEntity } from 'src/entities/medical-order.entity';

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
    DocumentController,
    UploadController,
    MedicalOrderController,
    BillController,
  ],
  providers: [
    UploadService,
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
    DocumentServices,
    OrganizationService,
    UploadService,
    OrganizationService,
    SaveTaskService,
    MedicalOrderService,
    BillService,
  ],
  imports: [
    TypeOrmModule.forFeature([
      ContactEntity,
      TraceabilityEntity,
      ContactNoteEntity,
      EventTaskEntity,
      UserEntity,
      DentalQuotationEntity,
      DentalModifierEntity,
      CcamUnitPriceEntity,
      CcamEntity,
      CashingEntity,
      CashingContactEntity,
      UserPreferenceEntity,
      ContactUserEntity,
      UploadEntity,
      ContactDocumentEntity,
      DentalEventTaskEntity,
      UploadEntity,
      CorrespondentEntity,
      TraceabilityEntity,
      PatientAmoEntity,
      MedicalOrderEntity,
      BillEntity,
    ]),
    UserModule,
    PatientModule,
    UploadModule,
  ],
  exports: [ContactService],
})
export class ContactModule {}
