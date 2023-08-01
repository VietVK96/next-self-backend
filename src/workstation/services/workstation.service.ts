import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ImagingSoftwareEntity } from 'src/entities/imaging-software.entity';
import { WorkstationEntity } from 'src/entities/workstation.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateWorkstationDto } from '../dto/workstation.dto';

@Injectable()
export class WorkstationService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(WorkstationEntity)
    private workstaionRepository: Repository<WorkstationEntity>,
    @InjectRepository(ImagingSoftwareEntity)
    private imagingSoftwareRepository: Repository<ImagingSoftwareEntity>,
  ) {}

  async getWorkstations(organizationID: number) {
    return await this.workstaionRepository.find({
      where: {
        organizationId: organizationID,
      },
      order: {
        name: 'DESC',
      },
    });
  }

  async createWorkstations(
    organizationId: number,
    payload: CreateWorkstationDto,
  ) {
    if (organizationId)
      return await this.workstaionRepository.save({
        ...payload,
        organizationId,
      });
  }

  async updateWorkstations(id: number, payload: CreateWorkstationDto) {
    const currentWorkstaion = await this.workstaionRepository.findOneOrFail({
      where: { id },
    });
    return await this.workstaionRepository.save({
      ...currentWorkstaion,
      ...payload,
    });
  }

  async deleteWorkstations(id: number) {
    const currentWorkstaion = await this.workstaionRepository.findOneOrFail({
      where: { id },
    });
    await this.workstaionRepository.remove(currentWorkstaion);
    return;
  }
}
