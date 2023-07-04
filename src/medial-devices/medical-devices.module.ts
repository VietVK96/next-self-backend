import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FindMedicalDevicesService } from './services/find.medical-devices.service';
import { FindMedicalDevicesController } from './medical-devices.controller';
import { MedicalDeviceEntity } from 'src/entities/medical-device.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalDeviceEntity])],
  controllers: [FindMedicalDevicesController],
  providers: [FindMedicalDevicesService],
})
export class MedicalDevicesModule {}
