import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkstationEntity } from 'src/entities/workstation.entity';
import { CreateWorkstationDto } from '../dto/workstation.dto';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { Repository } from 'typeorm';

@Injectable()
export class WorkstationService {
  constructor(
    @InjectRepository(WorkstationEntity)
    private workstaionRepository: Repository<WorkstationEntity>,
  ) {}

  async getWorkstations(organizationID: number) {
    try {
      return await this.workstaionRepository.find({
        where: {
          organizationId: organizationID,
        },
        order: {
          name: 'DESC',
        },
      });
    } catch (error) {
      throw new CBadRequestException(error?.message);
    }
  }

  async getWorkstation(organizationID: number, id: number) {
    try {
      return await this.workstaionRepository.findOne({
        where: {
          organizationId: organizationID,
          id,
        },
      });
    } catch (error) {
      throw new CBadRequestException(error?.message);
    }
  }

  async createWorkstations(
    organizationId: number,
    payload: CreateWorkstationDto,
  ) {
    try {
      if (organizationId)
        return await this.workstaionRepository.save({
          ...payload,
          organizationId,
        });
    } catch (error) {
      throw new CBadRequestException(error?.message);
    }
  }

  async updateWorkstations(id: number, payload: CreateWorkstationDto) {
    try {
      const currentWorkstaion = await this.workstaionRepository.findOneOrFail({
        where: { id },
      });
      return await this.workstaionRepository.save({
        ...currentWorkstaion,
        ...payload,
      });
    } catch (error) {
      throw new CBadRequestException(error?.message);
    }
  }

  async deleteWorkstations(id: number) {
    try {
      const currentWorkstaion = await this.workstaionRepository.findOneOrFail({
        where: { id },
      });
      await this.workstaionRepository.remove(currentWorkstaion);
      return;
    } catch (error) {
      throw new CBadRequestException(error?.message);
    }
  }
}
