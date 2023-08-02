import { Module } from '@nestjs/common';
import { MedicamentFamilyController } from './medicament-family.controller';
import { MedicamentFamilyService } from './services/medicament-family.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicamentFamilyEntity } from 'src/entities/medicament-family.entity';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { PermissionService } from 'src/user/services/permission.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MedicamentFamilyEntity, OrganizationEntity]),
  ],
  controllers: [MedicamentFamilyController],
  providers: [MedicamentFamilyService, PermissionService],
})
export class MedicamentFamilyModule {}
