import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { FindMedicalDevicesService } from './services/find.medicalDevices.service';
import { FindMedicalDevicesController } from './medicalDevices.controller';
import { MedicalDeviceEntity } from 'src/entities/medical-device.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalDeviceEntity])],
  controllers: [FindMedicalDevicesController],
  providers: [FindMedicalDevicesService],
})
export class MedicalDevicesModule {}
