import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MedicalDeviceEntity } from 'src/entities/medical-device.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FindMedicalDevicesService {
  constructor(
    @InjectRepository(MedicalDeviceEntity)
    private readonly repo: Repository<MedicalDeviceEntity>,
  ) {}
  async getMedicalDevices(organizationID: number) {
    return await this.repo.find({
      where: {
        organizationId: organizationID,
      },
    });
  }
}
