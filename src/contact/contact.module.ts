import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FindContactController } from './find.contact.controller';
import { HistoricalController } from './historical.controller';
import { ContactService } from './services/contact.service';
import { FindContactService } from './services/find.contact.service';
import { HistoricalService } from './services/historical.service';
import { ContactPaymentService } from './services/contact.payment.service';
import { ContactPaymentController } from './contact.payment.controller';
import { NoteService } from './services/note.service';
import { NoteController } from './note.controller';
import { ActController } from './act.controller';
import { ActServices } from './services/act.service';
import { TaskService } from './services/task.service';
import { TaskController } from './task.controller';
import { PatientModule } from 'src/patient/patient.module';
import { PermissionService } from 'src/user/services/permission.service';
import { FamilyController } from './family.controller';
import { FamilyService } from './services/family.service';
import { UserModule } from 'src/user/user.module';
import { DocumentServices } from './services/document.service';
import { DocumentController } from './document.controller';
import { UploadService } from 'src/upload/services/upload.service';
import { UploadModule } from 'src/upload/upload.module';
import { UploadController } from 'src/upload/upload.controller';
import { OrganizationService } from 'src/organization/service/organization.service';
import { SaveTaskService } from './services/save.task.service';
import { ContactPdfService } from './services/contact.pdf.service';
import { ContactPdfController } from './contact.pdf.controller';
import { BillController } from './bill.controller';
import { BillService } from './services/bill.service';
import { MedicalOrderController } from './medicalOrder.controller';
import { MedicalOrderService } from './services/medicalOrder.service';
import { ContactController } from './contact.controller';
import { SaveUpdateContactService } from './services/saveUpdate.contact.service';
import { ContraindicationContactController } from './contraindication.contact.controller';
import { ContraindicationContactService } from './services/contraindication.contact.service';
import { CashingService } from './services/cashing.service';
import { CashingController } from './cashing.controller';
import { MailController } from './mail.controller';
import { MailService } from './services/mail.service';
import { listEntities } from 'src/entities';
import { ReminderVisitService } from './services/reminderVisit.service';
import { ReminderVisitController } from './reminderVisit.controller';
import { BullModule } from '@nestjs/bull';
import { BullConfigService } from 'src/common/config/bull.config';
import { PatientService } from 'src/patient/service/patient.service';
import { AddressService } from 'src/address/service/address.service';
import { PaymentScheduleService } from 'src/payment-schedule/services/payment-schedule.service';
import { MailTransportService } from 'src/mail/services/mailTransport.service';
import { DocumentMailService } from 'src/mail/services/document.mail.service';
import { MailModule } from 'src/mail/mail.module';
import { NotifierModule } from 'src/notifier/notifier.module';
import { TemplateMailService } from 'src/mail/services/template.mail.service';

@Module({
  controllers: [
    FindContactController,
    HistoricalController,
    ContactPaymentController,
    ActController,
    TaskController,
    NoteController,
    FamilyController,
    DocumentController,
    UploadController,
    ContactPdfController,
    MedicalOrderController,
    BillController,
    ContactController,
    ContraindicationContactController,
    CashingController,
    MailController,
    ReminderVisitController,
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
    // PatientModule,
    NoteService,
    ActServices,
    TaskService,
    PermissionService,
    FamilyService,
    DocumentServices,
    OrganizationService,
    UploadService,
    OrganizationService,
    SaveTaskService,
    ContactPdfService,
    MedicalOrderService,
    BillService,
    SaveUpdateContactService,
    ContraindicationContactService,
    CashingService,
    MailService,
    ReminderVisitService,
    PatientService,
    PatientService,
    AddressService,
    PermissionService,
    ContactService,
    PaymentScheduleService,
    MailTransportService,
    DocumentMailService,
  ],
  imports: [
    TypeOrmModule.forFeature(listEntities),
    forwardRef(() => MailModule),
    UserModule,
    PatientModule,
    UploadModule,
    BullModule.registerQueueAsync({
      name: 'amount-due',
      useClass: BullConfigService,
    }),
    NotifierModule,
  ],
  exports: [ContactService, ContactPaymentService],
})
export class ContactModule {}
