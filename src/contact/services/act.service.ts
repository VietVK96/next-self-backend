import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TraceabilityEntity } from 'src/entities/traceability.entity';
import { Repository } from 'typeorm/repository/Repository';
import { UpdateTraceabilitiesDto } from '../dto/act.contact.dto';

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
        id: data?.id,
        medicalDevice: {
          id: data?.medicalDevice?.id,
          name: data?.medicalDevice?.name,
        },
        observation: data?.observation,
        reference: data?.reference,
      };
    });
  }

  async updateTraceabilities(id: number, payload: UpdateTraceabilitiesDto) {
    const data = await this.traceabilityRepository.find({
      where: { actId: id },
      select: ['id'],
    });
    const idUpdateDate = payload.traceabilities.filter((e) => e.id);
    const idDelete = data.filter(
      (e) => !idUpdateDate.find((v) => v.id == e.id),
    );
    await this.traceabilityRepository.delete(idDelete.map((id) => id.id));
    const req = payload.traceabilities.map((up) => {
      return up?.id
        ? {
            medicalDeviceId: up?.medicalDeviceId,
            reference: up?.reference,
            observation: up?.observation,
            actId: id,
            id: up?.id,
          }
        : {
            medicalDeviceId: up?.medicalDeviceId,
            reference: up?.reference,
            observation: up?.observation,
            actId: id,
          };
    });
    return await this.traceabilityRepository.save(req);
  }
}
