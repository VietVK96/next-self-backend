import { Injectable } from '@nestjs/common';
import { DataSource, IsNull, MoreThan, Not, Repository } from 'typeorm';
import { OdontogramCurrentDto } from '../dto/patientBalance.dto';
import { ContactEntity } from 'src/entities/contact.entity';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DentalEventTaskEntity } from 'src/entities/dental-event-task.entity';
import { LibraryOdontogramEntity } from 'src/entities/library-odontogram.entity';

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
