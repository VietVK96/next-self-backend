import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalController } from './medical.controller';
import { MedicalService } from './services/medical.service';
import { ContactEntity } from 'src/entities/contact.entity';
import { MedicalOrderEntity } from 'src/entities/medical-order.entity';
import { ClaudeBernardService } from 'src/bcb/services/claudeBernard.Service';

@Module({
  imports: [TypeOrmModule.forFeature([ContactEntity, MedicalOrderEntity])],
  controllers: [MedicalController],
  providers: [MedicalService, ClaudeBernardService],
})
export class MedicalModule {}
