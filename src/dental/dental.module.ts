import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalHeaderEntity } from 'src/entities/medical-header.entity';
import { MedicalOrderEntity } from 'src/entities/medical-order.entity';
import { DentalController } from './dental.controller';
import { OrdonnancesServices } from './services/ordonnances.services';

@Module({
  imports: [
    TypeOrmModule.forFeature([MedicalHeaderEntity, MedicalOrderEntity]),
  ],
  controllers: [DentalController],
  providers: [OrdonnancesServices],
})
export class DentalModule {}
