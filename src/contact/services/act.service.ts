import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { TraceabilityEntity } from 'src/entities/traceability.entity';
import { Repository } from 'typeorm/repository/Repository';
import { ActDto, UpdateTraceabilitiesDto } from '../dto/act.contact.dto';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { EntityManager } from 'typeorm';
import { TraceabilityStatusEnum } from 'src/constants/act';
import { DentalEventTaskEntity } from 'src/entities/dental-event-task.entity';
@Injectable()
export class ActServices {
  constructor(
    @InjectRepository(TraceabilityEntity)
    private traceabilityRepository: Repository<TraceabilityEntity>,
    @InjectRepository(EventTaskEntity)
    private eventTaskRepository: Repository<EventTaskEntity>,
    @InjectRepository(DentalEventTaskEntity)
    private dentalEventRepository: Repository<DentalEventTaskEntity>,
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
      await this.eventTaskRepository.findOne({
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
        const idTraces = idDelete.map((idTrace) => idTrace.id);
        await this.traceabilityRepository.delete(idTraces);
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
      await manager.save(TraceabilityEntity, req);
    });

    const dataAfter = await this.traceabilityRepository.find({
      where: { actId: id },
      select: {
        id: true,
        medicalDeviceId: true,
        reference: true,
      },
    });

    if (dataAfter) {
      let traceabilityStatus = TraceabilityStatusEnum.NONE;
      for (const data of dataAfter) {
        traceabilityStatus =
          data.medicalDeviceId !== null && data.reference !== ''
            ? TraceabilityStatusEnum.FILLED
            : data.reference !== ''
            ? TraceabilityStatusEnum.FILLED
            : data.medicalDeviceId !== null
            ? TraceabilityStatusEnum.UNFILLED
            : TraceabilityStatusEnum.NONE;
        await this.eventTaskRepository.save({
          id,
          traceabilityStatus,
        });
      }
    }
  }

  async getShowAct(id: number) {
    const data = await this.eventTaskRepository.findOne({
      where: { id: id },
    });
    const dataDental = await this.dentalEventRepository.findOne({
      where: { id: id },
    });
    const { date, name } = data;
    const { ald } = dataDental;
    return {
      date,
      id,
      label: name ?? '',
      medical: { ald: !!ald },
    };
  }

  async updateAct(id: number, payload: ActDto) {
    const ald = payload?.medical?.ald ? 1 : 0;
    const data = await this.eventTaskRepository.save({
      id: payload?.id,
      date: payload?.date,
      label: payload?.label,
    });
    await this.dentalEventRepository.save({
      id: payload.id,
      ald,
    });
    const { date, label } = data;
    return {
      date,
      id,
      label: label ?? '',
      medical: { ald: !!ald },
    };
  }
}
