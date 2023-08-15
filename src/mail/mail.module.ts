import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailController } from './mail.controller';
import { MailService } from './services/mail.service';
import { PatientService } from 'src/patient/service/patient.service';
import { AddressService } from 'src/address/service/address.service';
import { PermissionService } from 'src/user/services/permission.service';
import { ContactService } from 'src/contact/services/contact.service';
import { PaymentScheduleService } from 'src/payment-schedule/services/payment-schedule.service';
import { EntityModule, listEntities } from 'src/entities';

@Module({
  imports: [TypeOrmModule.forFeature(listEntities), EntityModule],
  controllers: [MailController],
  providers: [
    MailService,
    PatientService,
    AddressService,
    PermissionService,
    ContactService,
    PaymentScheduleService,
  ],
  exports: [MailService],
})
export class MailModule {}
