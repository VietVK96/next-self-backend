import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalHeaderEntity } from 'src/entities/medical-header.entity';
import { MedicalOrderEntity } from 'src/entities/medical-order.entity';
import { DentalController } from './dental.controller';
import { OrdonnancesServices } from './services/ordonnances.services';
import { FactureServices } from './services/facture.services';
import { BillEntity } from 'src/entities/bill.entity';
import { BillLineEntity } from 'src/entities/bill-line.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MedicalHeaderEntity,
      MedicalOrderEntity,
      BillEntity,
      BillLineEntity,
      MedicalHeaderEntity,
    ]),
  ],
  controllers: [DentalController],
  providers: [OrdonnancesServices, FactureServices],
})
export class DentalModule {}
