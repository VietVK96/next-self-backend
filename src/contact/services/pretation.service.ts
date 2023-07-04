import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { DataSource, EntityManager, In } from 'typeorm';
import { PrestationDto } from '../dto/prestation.dto';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { ErrorCode } from 'src/constants/error';
import { DentalEventTaskEntity } from 'src/entities/dental-event-task.entity';

@Injectable()
export class PrestationService {
  constructor(
    @InjectRepository(EventTaskEntity)
    private eventTaskRepository: Repository<DentalEventTaskEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private dataSource: DataSource,
  ) {}

  async updatePrestation(payload: PrestationDto) {
    try {
      if (payload.id) {
        const installTask = `
        INSERT INTO T_EVENT_TASK_ETK (
          ETK_ID,
          USR_ID,
          CON_ID,
          EVT_ID,
          ETK_NAME,
          ETK_DATE,
          ETK_MSG,
          ETK_POS,
          ETK_DURATION,
          ETK_AMOUNT,
          ETK_COLOR,
          ETK_QTY,
          ETK_STATE,
          ccam_family)
      VALUES (?, ?, ?, ?, ?, DATE(?), ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY
      UPDATE
      USR_ID = VALUES(USR_ID),
      CON_ID = VALUES(CON_ID),
      EVT_ID = VALUES(EVT_ID),
      ETK_NAME = VALUES(ETK_NAME),
      ETK_DATE = VALUES(ETK_DATE),
      ETK_MSG = VALUES(ETK_MSG),
      ETK_POS = VALUES(ETK_POS),
      ETK_DURATION = VALUES(ETK_DURATION),
      ETK_AMOUNT = VALUES(ETK_AMOUNT),
      ETK_COLOR = VALUES(ETK_COLOR),
      ETK_QTY = VALUES(ETK_QTY),
      ETK_STATE = VALUES(ETK_STATE),
      ccam_family = VALUES(ccam_family)
        `;
        await this.dataSource.query(installTask, [
          payload?.id,
          payload?.practitionerId,
          payload?.contactId,
          payload?.eventId,
          payload?.name,
          payload?.date,
          payload?.msg,
          payload?.pos,
          payload?.duration,
          payload?.amount,
          payload?.color,
          payload?.qty,
          payload?.state,
          payload?.ccamFamily,
        ]);
        console.log('Acte', payload.contactId, 1);
      } else {
        console.log('Acte', payload.contactId, 2);
      }

      const installDentalTask = `
      INSERT INTO T_DENTAL_EVENT_TASK_DET (
        ETK_ID,
        ngap_key_id,
        DET_ALD,
        DET_TOOTH,
        DET_COEF,
        DET_EXCEEDING,
        DET_COMP,
        DET_TYPE,
        DET_PURCHASE_PRICE,
        DET_CCAM_CODE,
        DET_CCAM_OPPOSABLE,
        DET_CCAM_TELEM,
        DET_CCAM_MODIFIER,
        DET_SECU_AMOUNT,
        DET_SECU_REPAYMENT,
        DET_MUTUAL_REPAYMENT_TYPE,
        DET_MUTUAL_REPAYMENT_RATE,
        DET_MUTUAL_REPAYMENT,
        DET_MUTUAL_COMPLEMENT,
        DET_PERSON_REPAYMENT,
        DET_PERSON_AMOUNT )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY
    UPDATE
    ngap_key_id = VALUES(ngap_key_id),
    DET_ALD = VALUES(DET_ALD),
    DET_TOOTH = VALUES(DET_TOOTH),
    DET_COEF = VALUES(DET_COEF),
    DET_EXCEEDING = VALUES(DET_EXCEEDING),
    DET_COMP = VALUES(DET_COMP),
    DET_TYPE = VALUES(DET_TYPE),
    DET_PURCHASE_PRICE = VALUES(DET_PURCHASE_PRICE),
    DET_CCAM_CODE = VALUES(DET_CCAM_CODE),
    DET_CCAM_OPPOSABLE = VALUES(DET_CCAM_OPPOSABLE),
    DET_CCAM_TELEM = VALUES(DET_CCAM_TELEM),
    DET_CCAM_MODIFIER = VALUES(DET_CCAM_MODIFIER),
    DET_SECU_AMOUNT = VALUES(DET_SECU_AMOUNT),
    DET_SECU_REPAYMENT = VALUES(DET_SECU_REPAYMENT),
    DET_MUTUAL_REPAYMENT_TYPE = VALUES(DET_MUTUAL_REPAYMENT_TYPE),
    DET_MUTUAL_REPAYMENT_RATE = VALUES(DET_MUTUAL_REPAYMENT_RATE),
    DET_MUTUAL_REPAYMENT = VALUES(DET_MUTUAL_REPAYMENT),
    DET_MUTUAL_COMPLEMENT = VALUES(DET_MUTUAL_COMPLEMENT),
    DET_PERSON_REPAYMENT = VALUES(DET_PERSON_REPAYMENT),
    DET_PERSON_AMOUNT = VALUES(DET_PERSON_AMOUNT)
      `;
      await this.dataSource.query(installDentalTask, [
        payload?.id,
        payload?.ngapKeyId,
        payload?.ald,
        payload?.teeth,
        payload?.exceeding,
        payload?.comp,
        payload?.type,
        payload?.purchasePrice,
        payload?.ccamCode,
        payload?.ccamOpposable,
        payload?.ccamTelem,
        payload?.ccamModifier,
        payload?.secuAmount,
        payload?.secuRepayment,
        payload?.mutualRepaymentType,
        payload?.mutualRepaymentRate,
        payload?.mutualRepayment,
        payload?.mutualComplement,
        payload?.personRepayment,
        payload?.personAmount,
      ]);
    } catch {
      throw new CNotFoundRequestException(ErrorCode.STATUS_NOT_FOUND);
    }
  }
}
