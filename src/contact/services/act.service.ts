import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TraceabilityEntity } from 'src/entities/traceability.entity';
import { Repository } from 'typeorm/repository/Repository';

@Injectable()
export class ActServices {
  constructor(
    @InjectRepository(TraceabilityEntity)
    private traceabilityRepository: Repository<TraceabilityEntity>,
  ) {}

  async getTraceability(id: number) {
    const data = await this.traceabilityRepository.find({
      where: { actId: id },
      relations: {
        medicalDevice: true,
      },
    });
    return data.map((data) => {
      return {
        id: data.id,
        medicalDevice: {
          id: data.medicalDevice.id,
          name: data.medicalDevice.name,
        },
        observation: data.observation,
        reference: data.reference,
      };
    });
  }
}
