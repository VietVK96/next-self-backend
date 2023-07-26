import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DentalQuotationActEntity } from 'src/entities/dental-quotation-act.entity';
import { DentalEventTaskEntity } from 'src/entities/dental-event-task.entity';
import { DentalQuotationEntity } from 'src/entities/dental-quotation.entity';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { ThirdPartyAmcEntity } from 'src/entities/third-party-amc.entity';
import { ThirdPartyAmoEntity } from 'src/entities/third-party-amo.entity';
import { MedicalHeaderEntity } from 'src/entities/medical-header.entity';
import { CorrespondentEntity } from 'src/entities/correspondent.entity';
import { MedicalOrderEntity } from 'src/entities/medical-order.entity';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { NgapKeyEntity } from 'src/entities/ngapKey.entity';
import { DevisStd2Services } from './services/devisStd2.services';
import { PrivilegeEntity } from 'src/entities/privilege.entity';
import { BillLineEntity } from 'src/entities/bill-line.entity';
import { ContactEntity } from 'src/entities/contact.entity';
import { LettersEntity } from 'src/entities/letters.entity';
import { AddressEntity } from 'src/entities/address.entity';
import { EventEntity } from 'src/entities/event.entity';
import { PhoneEntity } from 'src/entities/phone.entity';
import { BillEntity } from 'src/entities/bill.entity';
import { UserEntity } from 'src/entities/user.entity';
import { AmcEntity } from 'src/entities/amc.entity';
import { AmoEntity } from 'src/entities/amo.entity';
import { DevisHNController } from './devisHN.controller';
import { DentalController } from './dental.controller';
import { PaymentScheduleService } from 'src/payment-schedule/services/payment-schedule.service';
import { CorrespondentService } from 'src/correspondent/services/correspondent.service';
import { OrdonnancesServices } from './services/ordonnances.services';
import { DevisHNServices } from './services/devisRequestAjax.service';
import { PermissionService } from 'src/user/services/permission.service';
import { ContactService } from 'src/contact/services/contact.service';
import { PatientService } from 'src/patient/service/patient.service';
import { AddressService } from 'src/address/service/address.service';
import { FactureServices } from './services/facture.services';
import { MailService } from 'src/mail/services/mail.service';
import { UserService } from 'src/user/services/user.service';
import { DevisServices } from './services/devis.services';
import { ConfigService } from '@nestjs/config';
import { QuotationServices } from './services/quotation.service';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';
import { PlanPlfEntity } from 'src/entities/plan-plf.entity';
import { UserPreferenceQuotationEntity } from 'src/entities/user-preference-quotation.entity';
import { PlanEventEntity } from 'src/entities/plan-event.entity';
import { PaymentPlanDeadlineEntity } from 'src/entities/payment-plan-deadline.entity';

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
      UserMedicalEntity,
      ContactUserEntity,
      ContactNoteEntity,
      MedicalOrderEntity,
      MedicalHeaderEntity,
      CorrespondentEntity,
      ThirdPartyAmcEntity,
      ThirdPartyAmoEntity,
      UserPreferenceEntity,
      ContactEntity,
      DentalQuotationEntity,
      AddressEntity,
      PlanPlfEntity,
      DentalQuotationEntity,
      UserPreferenceQuotationEntity,
      PlanEventEntity,
      PaymentPlanDeadlineEntity,
      DentalQuotationActEntity,
      LettersEntity,
      PhoneEntity,
      UserEntity,
      AmoEntity,
      AmcEntity,
    ]),
  ],
  controllers: [DentalController, DevisHNController],
  providers: [
    PaymentScheduleService,
    CorrespondentService,
    DevisHNServices,
    UserService,
    PermissionService,
    ContactService,
    PatientService,
    AddressService,
    OrdonnancesServices,
    FactureServices,
    DevisStd2Services,
    MailService,
    QuotationServices,
    ConfigService,
    DevisServices,
  ],
})
export class DentalModule {}
