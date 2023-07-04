import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { TraceabilityEntity } from 'src/entities/traceability.entity';
import { Repository } from 'typeorm/repository/Repository';
import { UpdateTraceabilitiesDto } from '../dto/act.contact.dto';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { EntityManager, In } from 'typeorm';
import { TraceabilityStatusEnum } from 'src/constants/act';

@Injectable()
export class ActServices {
  constructor(
    @InjectRepository(TraceabilityEntity)
    private traceabilityRepository: Repository<TraceabilityEntity>,
    @InjectRepository(EventTaskEntity)
    private eventTaskRepository: Repository<EventTaskEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
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

  async updateTraceabilities(
    id: number,
    payload: UpdateTraceabilitiesDto,
    organizationId: number,
  ) {
    await this.entityManager.transaction(async (manager) => {
      const etk = await this.eventTaskRepository.findOne({
        where: { id: id },
      });
      const data = await this.traceabilityRepository.find({
        where: { actId: id },
        select: ['id'],
      });
      const idUpdateDate = payload.traceabilities.filter((e) => e.id);
      const idDelete = data.filter(
        (e) => !idUpdateDate.find((v) => v.id == e.id),
      );

      if (idDelete.length) {
        const idETKs = idDelete.map((idETK) => idETK.id);
        const etkDelete = await this.eventTaskRepository.find({
          where: { id: In(idETKs) },
        });
        await manager.save(
          EventTaskEntity,
          etkDelete?.map((etk) => ({
            ...etk,
            traceabilityStatus: TraceabilityStatusEnum.UNFILLED,
          })),
        );
      }
      if (data.length) {
        await manager.save(EventTaskEntity, {
          id,
          traceabilityStatus: TraceabilityStatusEnum.FILLED,
        });
      }
      const req = payload.traceabilities.map((up) => {
        return up?.id
          ? {
              medicalDeviceId: up?.medicalDeviceId,
              reference: up?.reference,
              observation: up?.observation,
              actId: id,
              id: up?.id,
              organizationId: organizationId,
            }
          : {
              medicalDeviceId: up?.medicalDeviceId,
              reference: up?.reference,
              observation: up?.observation,
              actId: id,
              organizationId: organizationId,
            };
      });
      return await manager.save(TraceabilityEntity, req);
    });
  }
}
