import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm/repository/Repository';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { SuccessResponse } from 'src/common/response/success.res';
import { UserService } from 'src/user/services/user.service';
import { PatientService } from 'src/patient/service/patient.service';
import { PermissionService } from 'src/user/services/permission.service';
import { PerCode } from 'src/constants/permissions';
import { CForbiddenRequestException } from 'src/common/exceptions/forbidden-request.exception';
import { EventEntity } from 'src/entities/event.entity';
import { EventOccurrenceEntity } from 'src/entities/event-occurrence.entity';
import { DataSource } from 'typeorm';
import { ContactEntity } from 'src/entities/contact.entity';
import { UserEntity } from 'src/entities/user.entity';
import { PlanEventEntity } from 'src/entities/plan-event.entity';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { DeteleEventDto } from '../dto/delete.event.dto';

@Injectable()
export class EventService {
  constructor(
    private dataSource: DataSource,
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
    try {
      const { eventId, contactId, practitionerId, planId } =
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

      const queryBuiler = this.dataSource.createQueryBuilder();
      if (!planId) {
        await queryBuiler
          .update(EventEntity)
          .set({ EVT_START: null, EVT_END: null })
          .where('`EVT_ID` = :eventId', { eventId })
          .execute();

        await queryBuiler
          .update(EventOccurrenceEntity)
          .set({ evo_date: null })
          .where('`evt_id` = :eventId', { eventId })
          .execute();
      } else {
        if (!payload.hasRecurrEvents) {
          await queryBuiler
            .update(EventEntity)
            .set({ EVT_DELETE: 1 })
            .where('`EVT_ID` = :eventId', { eventId })
            .execute();
        } else {
          if (payload.scp === 'all') {
            await queryBuiler
              .update(EventEntity)
              .set({ EVT_DELETE: 1 })
              .where('`EVT_ID` = :eventId', { eventId })
              .execute();
          } else if (payload.scp === 'tail') {
            await this.dataSource.query(
              `UPDATE event_occurrence_evo evo
              INNER JOIN event_occurrence_evo evo1 ON evo1.evo_id = ?
              SET evo.evo_exception = 1
              WHERE evo.evo_date >= evo1.evo_date
                AND evo.evt_id = evo1.evt_id`,
              [id],
            );
          } else {
            await queryBuiler
              .update(EventOccurrenceEntity)
              .set({ evo_exception: 1 })
              .where('`evo_id` = :id', { id })
              .execute();
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
}
