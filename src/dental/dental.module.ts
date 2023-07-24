import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalHeaderEntity } from 'src/entities/medical-header.entity';
import { MedicalOrderEntity } from 'src/entities/medical-order.entity';
import { DentalController } from './dental.controller';
import { OrdonnancesServices } from './services/ordonnances.services';
import { FactureServices } from './services/facture.services';
import { BillEntity } from 'src/entities/bill.entity';
import { BillLineEntity } from 'src/entities/bill-line.entity';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { DentalEventTaskEntity } from 'src/entities/dental-event-task.entity';
import { EventEntity } from 'src/entities/event.entity';
import { NgapKeyEntity } from 'src/entities/ngapKey.entity';
import { PrivilegeEntity } from 'src/entities/privilege.entity';
import { UserEntity } from 'src/entities/user.entity';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { ContactEntity } from 'src/entities/contact.entity';
import { DentalQuotationEntity } from 'src/entities/dental-quotation.entity';
import { AddressEntity } from 'src/entities/address.entity';
import { DevisServices } from './services/devis.services';
import { MailService } from 'src/mail/services/mail.service';
import { LettersEntity } from 'src/entities/letters.entity';
import { ContactService } from 'src/contact/services/contact.service';
import { ConfigService } from '@nestjs/config';
import { PatientService } from 'src/patient/service/patient.service';
import { PermissionService } from 'src/user/services/permission.service';
import { AddressService } from 'src/address/service/address.service';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { ThirdPartyAmcEntity } from 'src/entities/third-party-amc.entity';
import { ThirdPartyAmoEntity } from 'src/entities/third-party-amo.entity';
import { AmoEntity } from 'src/entities/amo.entity';
import { AmcEntity } from 'src/entities/amc.entity';
import { PaymentScheduleService } from 'src/payment-schedule/services/payment-schedule.service';
import { UserPreferenceQuotationEntity } from 'src/entities/user-preference-quotation.entity';
import { QuotationServices } from './services/quotation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MedicalHeaderEntity,
      MedicalOrderEntity,
      BillEntity,
      BillLineEntity,
      EventTaskEntity,
      DentalEventTaskEntity,
      EventEntity,
      NgapKeyEntity,
      PrivilegeEntity,
      UserEntity,
      UserPreferenceEntity,
      ContactEntity,
      DentalQuotationEntity,
      AddressEntity,
      LettersEntity,
      ContactUserEntity,
      ThirdPartyAmcEntity,
      ThirdPartyAmoEntity,
      AmoEntity,
      AmcEntity,
      UserPreferenceQuotationEntity,
    ]),
  ],
  controllers: [DentalController],
  providers: [
    OrdonnancesServices,
    FactureServices,
    DevisServices,
    MailService,
    ContactService,
    ConfigService,
    PatientService,
    PermissionService,
    AddressService,
    PaymentScheduleService,
    QuotationServices,
  ],
})
export class DentalModule {}
