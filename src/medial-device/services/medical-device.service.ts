import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MedicalDeviceEntity } from 'src/entities/medical-device.entity';
import { Repository } from 'typeorm';
import { CreateMedicalDeviceDto } from '../dto/medical-device.dto';

@Injectable()
export class MedicalDevicesService {
  constructor(
    @InjectRepository(MedicalDeviceEntity)
    private readonly repo: Repository<MedicalDeviceEntity>,
  ) {}
  async createMedicalDevices(
    organizationId: number,
    payload: CreateMedicalDeviceDto,
  ) {
    if (organizationId)
      return await this.repo.save({
        ...payload,
        organizationId,
      });
  }

  async updateMedicalDevices(id: number, payload: CreateMedicalDeviceDto) {
    const currentMedicalDevice = await this.repo.findOneOrFail({
      where: { id },
    });
    return await this.repo.save({
      ...currentMedicalDevice,
      ...payload,
    });
  }

  async deleteMedicalDevices(id: number) {
    const currentMedicalDevice = await this.repo.findOneOrFail({
      where: { id },
    });
    await this.repo.remove(currentMedicalDevice);
    return;
  }
}
