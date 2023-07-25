import { Module } from '@nestjs/common';
import { PrescriptionTemplateEntity } from 'src/entities/prescription-template.entity';
import { PrescriptionTemplateController } from './prescription-template.controller';
import { PrescriptionTemplateService } from './services/prescription-template.service';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicamentEntity } from 'src/entities/medicament.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PrescriptionTemplateEntity,
      OrganizationEntity,
      MedicamentEntity,
    ]),
  ],
  controllers: [PrescriptionTemplateController],
  providers: [PrescriptionTemplateService],
})
export class PrescriptionTemplateModule {}
