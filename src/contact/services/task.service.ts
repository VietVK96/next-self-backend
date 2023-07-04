import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { EventTaskDto, EventTaskPatchDto } from '../dto/task.contact.dto';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { ErrorCode } from 'src/constants/error';
import { DataSource } from 'typeorm';
import { ExceedingEnum } from 'src/constants/act';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(EventTaskEntity)
    private eventTaskRepository: Repository<EventTaskEntity>,
    private dataSource: DataSource,
  ) {}

  async updateEventTask(payload: EventTaskDto) {
    if (
      !(await this.eventTaskRepository.find({
        where: { id: payload.id, conId: payload.user },
      }))
    ) {
      throw new CNotFoundRequestException(ErrorCode.STATUS_NOT_FOUND);
    }
    await this.eventTaskRepository.update(payload.id, { state: 0 });
  }

  async updateEventTaskPatch(payload: EventTaskPatchDto) {
    let refreshAmount = false;
    if (!payload.name) {
      throw new CNotFoundRequestException(ErrorCode.STATUS_NOT_FOUND);
    } else {
      if (payload?.name) {
        if (payload?.name === 'name' && (payload.value as string)) {
          await this.eventTaskRepository.update(payload.pk, {
            name: payload.value,
          });
        }
        if (payload?.name === 'msg' && (payload.value as string)) {
          await this.eventTaskRepository.update(payload.pk, {
            msg: payload.value,
          });
        }
        if (payload?.name === 'date' && (payload.value as string)) {
          await this.eventTaskRepository.update(payload.pk, {
            date: payload.value,
          });
        }
        if (payload?.name === 'teeth' && (payload.value as string)) {
          const installTeeth = `INSERT INTO T_DENTAL_EVENT_TASK_DET (ETK_ID, DET_TOOTH) VALUES (?, ?) ON DUPLICATE KEY UPDATE DET_TOOTH = VALUES(DET_TOOTH)`;
          await this.dataSource.manager.query(installTeeth, [
            payload.pk,
            payload.value,
          ]);
        }
        let ngapKeyId;
        let coefficient;
        if (payload?.name === 'cotationNgap' && (payload.value as object)) {
          if (payload?.value && typeof payload.value === 'object') {
            ngapKeyId = payload.value?.ngap_key_id;
            coefficient = payload.value?.coef;
            const installCotationNgap = `INSERT INTO T_DENTAL_EVENT_TASK_DET (ETK_ID, ngap_key_id, DET_COEF)
					 VALUES (?, ?, ?)
					 ON DUPLICATE KEY UPDATE
					 ngap_key_id = VALUES(ngap_key_id),
					 DET_COEF = VALUES(DET_COEF)`;
            await this.dataSource.manager.query(installCotationNgap, [
              payload.pk,
              ngapKeyId,
              coefficient,
            ]);
            refreshAmount = true;
          }
        }
        if (
          payload?.name === 'code' ||
          (payload?.name === 'ccamCode' && (payload.value as string))
        ) {
          const installCode = `INSERT INTO T_DENTAL_EVENT_TASK_DET (ETK_ID, DET_TYPE, DET_CCAM_CODE)
					VALUES (?, 'CCAM', ?)
					ON DUPLICATE KEY UPDATE
					DET_TYPE = VALUES(DET_TYPE),
					DET_CCAM_CODE = VALUES(DET_CCAM_CODE)`;
          await this.dataSource.manager.query(installCode, [
            payload.pk,
            payload?.value,
          ]);
        }
        if (payload?.name === 'comp' && (payload.value as string)) {
          const installComp = `INSERT INTO T_DENTAL_EVENT_TASK_DET (ETK_ID, DET_COMP)
					VALUES (?, ?)
					ON DUPLICATE KEY UPDATE
					DET_COMP = VALUES(DET_COMP)`;
          await this.dataSource.manager.query(installComp, [
            payload.pk,
            payload?.value || null,
          ]);
        }
        if (payload?.name === 'exceeding' && (payload.value as string)) {
          const installExceeding = `INSERT INTO T_DENTAL_EVENT_TASK_DET (ETK_ID, DET_EXCEEDING)
					VALUES (?, ?)
					ON DUPLICATE KEY UPDATE
					DET_EXCEEDING = VALUES(DET_EXCEEDING)`;
          await this.dataSource.manager.query(installExceeding, [
            payload.pk,
            payload?.value || null,
          ]);
          if (payload.value === ExceedingEnum.GRATUIT) {
            const updateAMOUNT = ` 
						UPDATE T_EVENT_TASK_ETK
						SET ETK_AMOUNT = 0
						WHERE ETK_ID = ?`;
            await this.dataSource.manager.query(updateAMOUNT, [payload.pk]);
          }
        }
        if (payload?.name === 'caresheet' && (payload.value as boolean)) {
          const installCaresheet = `
					UPDATE T_EVENT_TASK_ETK
                JOIN T_DENTAL_EVENT_TASK_DET
                SET ETK_STATE = ?
                WHERE T_EVENT_TASK_ETK.ETK_ID = ?
                  AND T_EVENT_TASK_ETK.ETK_ID = T_DENTAL_EVENT_TASK_DET.ETK_ID
                  AND T_DENTAL_EVENT_TASK_DET.FSE_ID IS NULL`;
          await this.dataSource.manager.query(installCaresheet, [
            payload?.value,
            payload?.pk,
          ]);
        }
      }
    }
  }
}
