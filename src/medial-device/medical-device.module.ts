import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FindMedicalDevicesService } from './services/find.medical-device.service';
import { FindMedicalDevicesController } from './medical-device.controller';
import { MedicalDeviceEntity } from 'src/entities/medical-device.entity';
import { MedicalDevicesService } from './services/medical-device.service';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalDeviceEntity])],
  controllers: [FindMedicalDevicesController],
  providers: [FindMedicalDevicesService, MedicalDevicesService],
})
export class MedicalDevicesModule {}
