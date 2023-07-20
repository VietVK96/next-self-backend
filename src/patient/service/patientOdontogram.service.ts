import { Injectable } from '@nestjs/common';
import { DataSource, In, IsNull, MoreThan, Not, Repository } from 'typeorm';
import {
  OdontogramCurrentDto,
  TreatmentPlanOdontogramDto,
} from '../dto/patientBalance.dto';
import { ContactEntity } from 'src/entities/contact.entity';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DentalEventTaskEntity } from 'src/entities/dental-event-task.entity';
import { LibraryOdontogramEntity } from 'src/entities/library-odontogram.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';

@Injectable()
export class PatientOdontogramService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(ContactEntity)
    private patientRepository: Repository<ContactEntity>,
    @InjectRepository(EventTaskEntity)
    private eventTaskRepository: Repository<EventTaskEntity>,
    @InjectRepository(DentalEventTaskEntity)
    private dentalEvenTaskRepository: Repository<DentalEventTaskEntity>,
  ) {}

  async getCurrent(request: OdontogramCurrentDto) {
    try {
      const evenTasks = await this.eventTaskRepository.find({
        where: {
          conId: request?.patientId,
          status: MoreThan(0),
          libraryActId: Not(IsNull()),
          dental: {
            teeth: Not(IsNull()),
          },
        },
        relations: ['dental'],
        order: { createdAt: 'ASC' },
      });
      return this.odontogramRunStatus(evenTasks);
    } catch (err) {
      console.log('-----data-----', err);
    }
  }

  async getTreatmentPlanOdontogram(request: TreatmentPlanOdontogramDto) {
    try {
      const eventTaskByTreatments = await this.dataSource.query(
        `
          SELECT
          T_EVENT_TASK_ETK.ETK_ID
      FROM T_EVENT_TASK_ETK
      JOIN T_DENTAL_EVENT_TASK_DET
      LEFT OUTER JOIN T_EVENT_EVT ON T_EVENT_EVT.EVT_ID = T_EVENT_TASK_ETK.EVT_ID
      LEFT OUTER JOIN T_PLAN_EVENT_PLV ON T_PLAN_EVENT_PLV.EVT_ID = T_EVENT_EVT.EVT_ID
      LEFT OUTER JOIN T_PLAN_PLF ON T_PLAN_PLF.PLF_ID = T_PLAN_EVENT_PLV.PLF_ID
      WHERE T_EVENT_TASK_ETK.CON_ID = ?
        AND T_EVENT_TASK_ETK.ETK_STATE = 0
        AND T_EVENT_TASK_ETK.deleted_at IS NULL
        AND T_EVENT_TASK_ETK.library_act_id IS NOT NULL
        AND T_EVENT_TASK_ETK.ETK_ID = T_DENTAL_EVENT_TASK_DET.ETK_ID
        AND T_DENTAL_EVENT_TASK_DET.DET_TOOTH IS NOT NULL
        AND T_DENTAL_EVENT_TASK_DET.DET_TOOTH != ''
        AND (
          T_PLAN_PLF.PLF_ID IS NULL OR
          TO_DAYS(T_PLAN_PLF.PLF_ACCEPTED_ON) IS NOT NULL
        )
      ORDER BY T_EVENT_TASK_ETK.ETK_DATE, T_EVENT_TASK_ETK.created_at`,
        [request?.treatment_plan_id],
      );

      const ids = eventTaskByTreatments?.map((task) => task?.ETK_ID);
      const evenTasks = await this.eventTaskRepository.find({
        where: {
          id: In(ids),
        },
        relations: ['dental'],
        order: { createdAt: 'ASC' },
      });
      return this.odontogramRunStatus(evenTasks);
    } catch (error) {
      throw new CBadRequestException(error);
    }
  }
  async odontogramRunStatus(evenTasks: EventTaskEntity[]) {
    const applyXRayStyle: string[] = [];
    const applyCrownStyle: string[] = [];
    const applyRootStyle: string[] = [];
    const applyImplantStyle: { teeths: string[]; color: string }[] = [];
    const applyZoneVisibleStyle: {
      teeths: string[];
      zone: string[];
      color: string;
    }[] = [];
    const applyZoneInvisibleStyle: {
      teeths: string[];
      zone: string[];
      color: string;
    }[] = [];
    for (const evenTask of evenTasks) {
      const rgx = new RegExp(`/^HBQK(?!(002))/i`);
      const displayXray = rgx.test(evenTask?.dental?.ccamCode);
      const teethsNumber = evenTask?.dental?.teeth?.split(',');
      const libraryActQuantityId = evenTask?.libraryActQuantityId;
      const libraryActId = evenTask?.libraryActId;

      let library_odontograms = await this.dataSource
        .createQueryBuilder(LibraryOdontogramEntity, 'LO')
        .select()
        .innerJoin('library_act_quantity_odontogram', 'LAQO')
        .where('LO.id = LAQO.library_odontogram_id')
        .andWhere('LAQO.library_act_quantity_id = :libraryActQuantityId', {
          libraryActQuantityId,
        })
        .getMany();

      if (!library_odontograms.length) {
        library_odontograms = await this.dataSource
          .createQueryBuilder(LibraryOdontogramEntity, 'LO')
          .select()
          .innerJoin('library_act_odontogram', 'LAO')
          .where('LO.id = LAO.library_odontogram_id')
          .andWhere('LAO.library_act_id IN (:libraryActId)', { libraryActId })
          .getMany();
      }
      for (const odontogram of library_odontograms) {
        const color = odontogram?.color;
        const visibleCrown = odontogram?.visibleCrown;
        const visibleRoot = odontogram?.visibleRoot;
        const visibleImplant = odontogram?.visibleImplant;
        const visibleAreas = odontogram?.visibleAreas?.split(',');
        const invisibleAreas = odontogram?.invisibleAreas?.split(',');
        const rankOfTooth = odontogram?.rankOfTooth;
        if (rankOfTooth === null) {
          if (displayXray) applyXRayStyle?.push(...teethsNumber);
          if (!!visibleCrown === false) applyCrownStyle?.push(...teethsNumber);
          if (!!visibleRoot == false) applyRootStyle?.push(...teethsNumber);
          if (!!visibleImplant) {
            applyImplantStyle?.push({
              color,
              teeths: [...teethsNumber],
            });
          }
          if (visibleAreas?.length) {
            applyZoneVisibleStyle.push({
              color,
              teeths: [...teethsNumber],
              zone: [...visibleAreas],
            });
          }
          if (invisibleAreas?.length) {
            applyZoneInvisibleStyle.push({
              color: '#ffffff',
              teeths: [...teethsNumber],
              zone: [...invisibleAreas],
            });
          }
        } else if (teethsNumber?.length) {
          const teeth = teethsNumber[rankOfTooth - 1];
          if (displayXray) applyXRayStyle?.push(teeth);
          if (!!visibleCrown === false) applyCrownStyle?.push(teeth);
          if (!!visibleRoot == false) applyRootStyle?.push(teeth);
          if (!!visibleImplant) {
            applyImplantStyle?.push({
              color,
              teeths: [teeth],
            });
          }
          if (visibleAreas?.length) {
            applyZoneVisibleStyle.push({
              color,
              teeths: [teeth],
              zone: [...visibleAreas],
            });
          }
          if (invisibleAreas?.length) {
            applyZoneInvisibleStyle.push({
              color: '#ffffff',
              teeths: [teeth],
              zone: [...invisibleAreas],
            });
          }
        }
      }
    }

    return {
      applyCrownStyle,
      applyImplantStyle,
      applyRootStyle,
      applyXRayStyle,
      applyZoneInvisibleStyle,
      applyZoneVisibleStyle,
    };
  }
}
