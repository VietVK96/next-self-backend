import { Module } from '@nestjs/common';
import { MedicamentController } from './medicament.controller';
import { MedicamentService } from './services/medicament.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicamentEntity } from 'src/entities/medicament.entity';
import { PermissionService } from 'src/user/services/permission.service';
import { ContraindicationEntity } from 'src/entities/contraindication.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MedicamentEntity, ContraindicationEntity]),
  ],
  controllers: [MedicamentController],
  providers: [MedicamentService, PermissionService],
})
export class MedicamentModule {}
