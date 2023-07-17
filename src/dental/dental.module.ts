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
    ]),
  ],
  controllers: [DentalController],
  providers: [OrdonnancesServices, FactureServices],
})
export class DentalModule {}
