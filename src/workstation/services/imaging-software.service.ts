import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ImagingSoftwareEntity } from 'src/entities/imaging-software.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ImagingSoftwareService {
  constructor(
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
