import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ImagingSoftwareEntity } from 'src/entities/imaging-software.entity';
import { WorkstationEntity } from 'src/entities/workstation.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class ImagingSoftwareService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(WorkstationEntity)
    private workstaionRepository: Repository<WorkstationEntity>,
    @InjectRepository(ImagingSoftwareEntity)
    private imagingSoftwareRepository: Repository<ImagingSoftwareEntity>,
  ) {}

  async getImagingSoftwaresByWorkstationId(workstationId: number) {
    return await this.imagingSoftwareRepository.find({
      where: {
        workstationId: workstationId,
      },
      order: {
        name: 'DESC',
      },
    });
  }
}
