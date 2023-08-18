import { Module } from '@nestjs/common';
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

@Module({
  imports: [TypeOrmModule.forFeature(listEntities), ContactModule],
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
  ],
  exports: [MailService, DocumentMailService],
})
export class MailModule {}
