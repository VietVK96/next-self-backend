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
import { DevisStd2Services } from './services/devisStd2.services';
import { PrivilegeEntity } from 'src/entities/privilege.entity';
import { UserEntity } from 'src/entities/user.entity';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { ContactEntity } from 'src/entities/contact.entity';
import { DentalQuotationEntity } from 'src/entities/dental-quotation.entity';
import { AddressEntity } from 'src/entities/address.entity';
import { PlanPlfEntity } from 'src/entities/plan-plf.entity';
import { UserPreferenceQuotationEntity } from 'src/entities/user-preference-quotation.entity';
import { PlanEventEntity } from 'src/entities/plan-event.entity';
import { PaymentPlanDeadlineEntity } from 'src/entities/payment-plan-deadline.entity';
import { DentalQuotationActEntity } from 'src/entities/dental-quotation-act.entity';

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
      PlanPlfEntity,
      DentalQuotationEntity,
      UserPreferenceQuotationEntity,
      PlanEventEntity,
      PaymentPlanDeadlineEntity,
      DentalQuotationActEntity,
    ]),
  ],
  controllers: [DentalController],
  providers: [OrdonnancesServices, FactureServices, DevisStd2Services],
})
export class DentalModule {}
