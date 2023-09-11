import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MedicalDeviceEntity } from 'src/entities/medical-device.entity';
import { Repository } from 'typeorm';
import { CreateMedicalDeviceDto } from '../dto/medical-device.dto';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { SuccessResponse } from 'src/common/response/success.res';

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

  async deleteMedicalDevices(id: number): Promise<SuccessResponse> {
    if (!id) {
      throw new CBadRequestException(ErrorCode.FORBIDDEN);
    }

    const currentMedicalDevice = await this.repo.findOne({
      where: { id },
      relations: { traceabilities: true },
    });
    if (!currentMedicalDevice) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }
    if (currentMedicalDevice?.traceabilities?.length === 0) {
      await this.repo.remove(currentMedicalDevice);
      return {
        success: true,
      };
    } else {
      throw new CBadRequestException(ErrorCode.CANNOT_DELETE_TRACEABILITY);
    }
  }
}
