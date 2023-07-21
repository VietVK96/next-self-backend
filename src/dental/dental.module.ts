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
import { DevisHNController } from './devisHN.controller';
import { DevisHNServices } from './services/devisRequestAjax.service';
import { LettersEntity } from 'src/entities/letters.entity';
import { DentalQuotationActEntity } from 'src/entities/dental-quotation-act.entity';
import { MailService } from 'src/mail/services/mail.service';
import { UserService } from 'src/user/services/user.service';
import { CorrespondentService } from 'src/correspondent/services/correspondent.service';
import { PatientService } from 'src/patient/service/patient.service';
import { PaymentScheduleService } from 'src/payment-schedule/services/payment-schedule.service';
import { AddressService } from 'src/address/service/address.service';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';
import { PhoneEntity } from 'src/entities/phone.entity';
import { CorrespondentEntity } from 'src/entities/correspondent.entity';
import { PermissionService } from 'src/user/services/permission.service';
import { ContactService } from 'src/contact/services/contact.service';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { ThirdPartyAmcEntity } from 'src/entities/third-party-amc.entity';
import { AmcEntity } from 'src/entities/amc.entity';
import { AmoEntity } from 'src/entities/amo.entity';
import { ThirdPartyAmoEntity } from 'src/entities/third-party-amo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MedicalHeaderEntity,
      MedicalOrderEntity,
      BillEntity,
      BillLineEntity,
      MedicalHeaderEntity,
      EventTaskEntity,
      DentalEventTaskEntity,
      EventEntity,
      EventEntity,
      DentalEventTaskEntity,
      NgapKeyEntity,
      PrivilegeEntity,
      UserEntity,
      UserPreferenceEntity,
      ContactEntity,
      DentalQuotationEntity,
      AddressEntity,
      LettersEntity,
      DentalQuotationActEntity,
      UserMedicalEntity,
      PhoneEntity,
      CorrespondentEntity,
      ContactUserEntity,
      ThirdPartyAmcEntity,
      ThirdPartyAmoEntity,
      AmoEntity,
      AmcEntity,
    ]),
  ],
  controllers: [DentalController, DevisHNController],
  providers: [
    OrdonnancesServices,
    FactureServices,
    DevisHNServices,
    MailService,
    UserService,
    CorrespondentService,
    PatientService,
    PaymentScheduleService,
    AddressService,
    PermissionService,
    ContactService,
  ],
})
export class DentalModule {}
