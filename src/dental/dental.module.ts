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
import { PlanPlfEntity } from 'src/entities/plan-plf.entity';
import { QuotesServices } from './services/quotes.service';
import { UserEntity } from 'src/entities/user.entity';
import { UserPreferenceQuotationEntity } from 'src/entities/user-preference-quotation.entity';
import { ContactEntity } from 'src/entities/contact.entity';
import { PaymentPlanService } from 'src/payment-plan/services/payment-plan.service';
import { PaymentSchedulesModule } from 'src/payment-plan/payment-schedules.module';
import { DentalQuotationEntity } from 'src/entities/dental-quotation.entity';
import { LibraryActEntity } from 'src/entities/library-act.entity';

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
      PlanPlfEntity,
      UserEntity,
      UserPreferenceQuotationEntity,
      ContactEntity,
      DentalQuotationEntity,
      LibraryActEntity,
    ]),
    PaymentSchedulesModule,
  ],
  controllers: [DentalController],
  providers: [OrdonnancesServices, FactureServices, QuotesServices],
})
export class DentalModule {}
