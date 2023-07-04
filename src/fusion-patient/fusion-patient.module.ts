import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactEntity } from 'src/entities/contact.entity';
import { FusionPatienController } from './fusion-patient.controller';
import { FusionPatientService } from './fusion-patient.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContactEntity])],
  controllers: [FusionPatienController],
  providers: [FusionPatientService],
})
export class FusionPatientModule {}
