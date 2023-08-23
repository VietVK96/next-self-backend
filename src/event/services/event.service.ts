import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { SuccessResponse } from 'src/common/response/success.res';
import { PermissionService } from 'src/user/services/permission.service';
import { PerCode } from 'src/constants/permissions';
import { CForbiddenRequestException } from 'src/common/exceptions/forbidden-request.exception';
import { EventEntity } from 'src/entities/event.entity';
import { EventOccurrenceEntity } from 'src/entities/event-occurrence.entity';
import { DataSource } from 'typeorm';
import { ContactEntity } from 'src/entities/contact.entity';
import { UserEntity } from 'src/entities/user.entity';
import { PlanEventEntity } from 'src/entities/plan-event.entity';
import { DeteleEventDto } from '../dto/delete.event.dto';
import { ResourceEntity } from 'src/entities/resource.entity';
import * as dayjs from 'dayjs';
import { Parser } from 'json2csv';
import { Response } from 'express';
import { Workbook } from 'exceljs';

@Injectable()
export class EventService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(EventEntity)
    private readonly repoEvent: Repository<EventEntity>,
    @InjectRepository(EventOccurrenceEntity)
    private readonly repoEventOccurrent: Repository<EventOccurrenceEntity>,
    private permissionService: PermissionService,
  ) {}

  async recordEventOccurrence(id: number) {
    const queryBuiler = this.dataSource.createQueryBuilder();
    return await queryBuiler
      .select(
        `EVT.EVT_ID AS eventId,
        EVT.CON_ID AS contactId,
        EVT.USR_ID AS practitionerId,
        PLV.PLF_ID AS planId`,
      )
      .from(EventOccurrenceEntity, 'evo')
      .innerJoin(EventEntity, 'EVT', 'EVT.EVT_ID = evo.evt_id')
      .leftJoin(ContactEntity, 'CON', 'CON.CON_ID = EVT.EVT_ID')
      .leftJoin(UserEntity, 'USR', 'USR.USR_ID = EVT.USR_ID')
      .leftJoin(PlanEventEntity, 'PLV', 'PLV.EVT_ID = EVT.EVT_ID')
      .where('evo.evo_id = :id', {
        id,
      })
      .getRawOne();
  }

  async detete(
    id: number,
    orgId: number,
    payload: DeteleEventDto,
  ): Promise<SuccessResponse> {
    const { eventId, practitionerId, planId } =
      await this.recordEventOccurrence(id);
    if (
      !this.permissionService.hasPermission(
        PerCode.PERMISSION_DELETE,
        8,
        orgId,
      ) ||
      !this.permissionService.hasPermission(
        PerCode.PERMISSION_CALENDAR,
        8,
        practitionerId,
      )
    ) {
      throw new CForbiddenRequestException(ErrorCode.FORBIDDEN);
    }
    try {
      if (planId) {
        await this.repoEvent.update(
          { id: eventId },
          { start: null, end: null },
        );
        await this.repoEventOccurrent.update(
          { evtId: eventId },
          { date: null },
        );
      } else {
        if (!payload.hasRecurrEvents) {
          await this.repoEvent.update({ id: eventId }, { delete: 1 });
        } else {
          if (payload.scp === 'all') {
            await this.repoEvent.update({ id: eventId }, { delete: 1 });
          } else if (payload.scp === 'tail') {
            await this.dataSource.query(
              ` UPDATE event_occurrence_evo evo
              INNER JOIN event_occurrence_evo evo1 ON evo1.evo_id = ?
              SET evo.evo_exception = 1
              WHERE evo.evo_date >= evo1.evo_date
                AND evo.evt_id = evo1.evt_id`,
              [id],
            );
          } else {
            await this.repoEventOccurrent.update({ id }, { exception: 1 });
          }
        }
      }

      return {
        success: true,
      };
    } catch (e) {
      throw new CBadRequestException(ErrorCode.DELETE_UNSUCCESSFUL);
    }
  }

  async _getExportQuery(
    resources: number[],
    datetime1: string,
    datetime2: string,
  ) {
    const formatResources = resources.map((item) => `'${item}'`).join(',');
    const query = this.dataSource
      .createQueryBuilder()
      .select(
        `DISTINCT 
          eventOccurrence.id,eventOccurrence.evo_date,
          event.id,event.EVT_NAME,event.EVT_START,event.EVT_END,event.EVT_MSG,
          resource.id,resource.name,
          patient.id,patient.CON_NBR,patient.CON_LASTNAME,patient.CON_FIRSTNAME
          `,
      )
      .from(EventOccurrenceEntity, 'eventOccurrence')
      .innerJoin(EventEntity, 'event', 'eventOccurrence.evt_id = event.id')
      .innerJoin(
        ResourceEntity,
        'resource',
        'eventOccurrence.resource_id = resource.id',
      )
      .leftJoin(ContactEntity, 'patient', 'patient.id = event.CON_ID')
      .where(`eventOccurrence.resource IN (${formatResources})`)
      .andWhere('eventOccurrence.date >= :datetime1', { datetime1 })
      .andWhere('eventOccurrence.date <= :datetime1', { datetime2 })
      .andWhere('eventOccurrence.exception = false')
      .addGroupBy('eventOccurrence.id')
      .addOrderBy(
        'resource.name, eventOccurrence.date, event.EVT_START, event.EVT_END',
      );

    return await query.getRawMany();
  }

  _convertMillisecondsToTime(milliseconds: number) {
    const seconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${hours}:${minutes}`;
  }

  async export(
    res,
    resources: number[],
    datetime1: string,
    datetime2: string,
    format: string,
    range: number,
  ) {
    try {
      const events = await this._getExportQuery(
        resources,
        datetime1,
        datetime2,
      );

      const rows = [];

      for (const event of events) {
        rows.push({
          resourceName: event.name,
          date: dayjs(event.evo_date).format('DD/MM/YYYY'),
          startDatetime: dayjs(event.EVT_START).format('HH:mm'),
          duration: this._convertMillisecondsToTime(
            dayjs(event.EVT_END).diff(dayjs(event.EVT_START)),
          ),
          title: event.EVT_NAME,
          lastname: event.CON_LASTNAME,
          firstname: event.CON_FIRSTNAME,
          number: event.CON_NBR,
          observation: event.EVT_MSG,
        });
      }

      if (format.trim().toLocaleLowerCase() === 'csv') {
        const fields = [
          { label: 'Agenda', value: 'resourceName' },
          { label: 'Date', value: 'date' },
          { label: 'Heure', value: 'startDatetime' },
          { label: 'Durée', value: 'duration' },
          { label: 'Motif de consultation', value: 'title' },
          { label: 'Nom', value: 'lastname' },
          { label: 'Prénom', value: 'firstname' },
          { label: 'Numéro de dossier', value: 'number' },
          { label: 'Commentaire', value: 'observation' },
        ];
        const parser = new Parser({ fields });
        const data = parser.parse(rows);
        res.header('Content-Type', 'text/csv');
        res.attachment('rendez_vous.csv');
        res.status(200).send(data);
      } else {
        const book = new Workbook();
        const sheet = book.addWorksheet('Sheet1');

        sheet.columns = [
          { header: 'Agenda', key: 'resourceName' },
          { header: 'Date', key: 'date' },
          { header: 'Heure', key: 'startDatetime' },
          { header: 'Durée', key: 'duration' },
          { header: 'Motif de consultation', key: 'title' },
          { header: 'Nom', key: 'lastname' },
          { header: 'Prénom', key: 'firstname' },
          { header: 'Numéro de dossier', key: 'number' },
          { header: 'Commentaire', key: 'observation' },
        ];

        sheet.getColumn(1).width = 15;
        sheet.getColumn(2).width = 20;
        sheet.getColumn(3).width = 15;
        sheet.getColumn(4).width = 15;
        sheet.getColumn(5).width = 15;
        sheet.getColumn(6).width = 15;
        sheet.getColumn(7).width = 15;
        sheet.getColumn(8).width = 15;
        sheet.getColumn(9).width = 15;

        sheet.addRows(rows);
        const filename = `rendez_vous.xlsx`;
        res.set({
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename=' + filename,
        });
        await book.xlsx.write(res);
        res.end();
      }
    } catch {
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }
}
