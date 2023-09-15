import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailController } from './mail.controller';
import { MailService } from './services/mail.service';
import { PatientService } from 'src/patient/service/patient.service';
import { AddressService } from 'src/address/service/address.service';
import { PermissionService } from 'src/user/services/permission.service';
import { ContactService } from 'src/contact/services/contact.service';
import { PaymentScheduleService } from 'src/payment-schedule/services/payment-schedule.service';
import { listEntities } from 'src/entities';
import { MailTransportService } from './services/mailTransport.service';
import { ContactModule } from 'src/contact/contact.module';
import { DocumentMailService } from './services/document.mail.service';
import { PreviewMailService } from './services/preview.mail.service';
import { DataMailService } from './services/data.mail.service';
import { PdfMailService } from './services/pdf.mail.service';
import { TemplateMailService } from './services/template.mail.service';

@Module({
  imports: [
    TypeOrmModule.forFeature(listEntities),
    forwardRef(() => ContactModule),
  ],
  controllers: [MailController],
  providers: [
    MailService,
    PatientService,
    AddressService,
    PermissionService,
    ContactService,
    PaymentScheduleService,
    MailTransportService,
    DocumentMailService,
    PreviewMailService,
    DataMailService,
    PdfMailService,
    TemplateMailService,
  ],
  exports: [
    MailService,
    DocumentMailService,
    PreviewMailService,
    DataMailService,
    PdfMailService,
    TemplateMailService,
  ],
})
export class MailModule {}
