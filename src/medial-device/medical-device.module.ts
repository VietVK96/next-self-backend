import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FindMedicalDevicesService } from './services/find.medical-device.service';
import { FindMedicalDevicesController } from './medical-device.controller';
import { MedicalDeviceEntity } from 'src/entities/medical-device.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalDeviceEntity])],
  controllers: [FindMedicalDevicesController],
  providers: [FindMedicalDevicesService],
})
export class MedicalDevicesModule {}
