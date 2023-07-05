import { EventTaskEntity } from './../../entities/event-task.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { EventTaskSaveDto } from '../dto/task.contact.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactEntity } from 'src/entities/contact.entity';
import { CodeNatureAssuranceEnum } from 'src/constants/act';
import { CcamEntity } from 'src/entities/ccam.entity';
import * as dayjs from 'dayjs';
import { PatientAmoEntity } from 'src/entities/patient-amo.entity';
import { TraceabilityStatusEnum } from 'src/enum/traceability-status-enum';
import { TraceabilityEntity } from 'src/entities/traceability.entity';
import { ExceedingEnum } from 'src/enum/exceeding-enum.enum';

@Injectable()
export class SaveTaskService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(ContactEntity)
    private contactRepo: Repository<ContactEntity>,
    @InjectRepository(PatientAmoEntity)
    private patientAmoRepo: Repository<PatientAmoEntity>,
    @InjectRepository(CcamEntity)
    private ccamRepo: Repository<CcamEntity>,
    @InjectRepository(EventTaskEntity)
    private eventTaskRepo: Repository<EventTaskEntity>,
    @InjectRepository(TraceabilityEntity)
    private traceabilityRepo: Repository<TraceabilityEntity>,
  ) {}

  async save(payload: EventTaskSaveDto) {
    const patient = await this.contactRepo.findOneBy({ id: payload.contact });
    const amosOfPatient = await this.patientAmoRepo.findBy({
      patientId: patient.id,
    });
    const creationDate = Date.parse(payload.date);
    let codeNatureAssurance = CodeNatureAssuranceEnum.ASSURANCE_MALADIE;
    const amos: PatientAmoEntity[] = amosOfPatient.filter(
      (amo) =>
        (amo.startDate === null || Date.parse(amo.startDate) <= creationDate) &&
        (amo.endDate === null || Date.parse(amo.endDate) >= creationDate),
    );
    if (amos.length > 0) {
      codeNatureAssurance = amos[0]
        .codeNatureAssurance as CodeNatureAssuranceEnum;
    }

    const doctorId = payload.user;
    let amount = payload.amount ? parseFloat(payload.amount.toString()) : 0;
    const socialSecurityAmount = payload.secuAmount
      ? parseFloat(payload.secuAmount.toString())
      : 0;
    let coefficient = payload.coef ? parseFloat(payload.coef.toString()) : 1;
    let teeth = payload.teeth ? payload.teeth : null;
    const ccamId = payload.ccamId;

    if (ccamId !== null) {
      const ccam = await this.ccamRepo.findOneBy({ id: ccamId });
      if (ccam !== null) {
        const code = ccam.code;
        if (code === 'HBQK002' && teeth === null) {
          teeth = 0;
        }
        if (code === 'HBJD001') {
          const detartrageStm: { cnt: number } = await this.dataSource.query(
            `
          SELECT COUNT(*) as cnt
                    FROM T_EVENT_TASK_ETK
                    JOIN T_DENTAL_EVENT_TASK_DET
                    JOIN ccam
                    WHERE T_EVENT_TASK_ETK.USR_ID = ?
                    AND T_EVENT_TASK_ETK.CON_ID = ?
                    AND T_EVENT_TASK_ETK.ETK_DATE = ?
                    AND T_EVENT_TASK_ETK.ETK_ID = T_DENTAL_EVENT_TASK_DET.ETK_ID
                    AND T_DENTAL_EVENT_TASK_DET.ccam_id = ccam.id
                    AND ccam.code = 'HBJD001'`,
            [doctorId, patient.id, dayjs(creationDate).format('YYYY-MM-DD')],
          );
          if (detartrageStm.cnt > 0) {
            amount /= 2;
            coefficient = 0.5;
          }
        }
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let lastInsertId: number;
    try {
      await queryRunner.query(
        `INSERT INTO T_EVENT_TASK_ETK (USR_ID, CON_ID, library_act_id, library_act_quantity_id, parent_id, ETK_NAME, ETK_DATE, ETK_MSG, ETK_POS, ETK_DURATION, ETK_AMOUNT, ETK_COLOR, ETK_STATE, ccam_family)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
        [
          payload.user,
          patient.id,
          payload.library_act_id ?? null,
          payload.library_act_quantity_id ?? null,
          payload.parent_id ?? null,
          payload.name,
          dayjs(creationDate).format('YYYY-MM-DD'),
          payload.msg,
          payload.duration,
          amount,
          payload.color ?? 0,
          payload.state,
          payload.ccam_family,
        ],
      );

      const result: { lastInsertId: number } = await queryRunner.query(
        'SELECT LAST_INSERT_ID() AS lastInsertId',
      );
      lastInsertId = result[0].lastInsertId;

      // Insertion des informations dentaires
      await queryRunner.query(
        `INSERT INTO T_DENTAL_EVENT_TASK_DET (
          ETK_ID,
          ccam_id,
          ngap_key_id, 
          dental_material_id,
          DET_TOOTH, 
          DET_COEF, 
          DET_EXCEEDING, 
          DET_COMP, 
          DET_TYPE, 
          DET_CODE, 
          DET_PURCHASE_PRICE, 
          DET_CCAM_CODE, 
          DET_CCAM_OPPOSABLE, 
          DET_CCAM_TELEM, 
          DET_CCAM_MODIFIER,
          code_nature_assurance,
          exemption_code,
          exceptional_refund,
          DET_SECU_AMOUNT
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          lastInsertId,
          payload.ccamId ?? null,
          payload.ngap_key_id ?? null,
          payload.dental_material_id ?? null,
          teeth,
          coefficient,
          payload.exceeding ?? null,
          payload.comp,
          payload.type,
          payload.code,
          payload.purchasePrice,
          payload.ccamCode,
          payload.ccamOpposable ?? 0,
          payload.ccamTelem ?? 1,
          payload.ccamModifier,
          codeNatureAssurance,
          payload.exemption_code ?? 0,
          payload.exceptional_refund ?? false,
          socialSecurityAmount,
        ],
      );
      // await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }

    const act = await this.eventTaskRepo.findOneBy({ id: lastInsertId });
    const libraryActQuantity = act.libraryActQuantity;
    if (libraryActQuantity) {
      let traceabilityStatus = TraceabilityStatusEnum.NONE;
      const mergeArr1 = libraryActQuantity.traceabilities;
      const mergeArr2 =
        libraryActQuantity.traceabilityMerged === 1
          ? libraryActQuantity.act.traceabilities
          : [];
      const traceabilities = [...mergeArr1, ...mergeArr2];

      if (traceabilities.length > 0) {
        traceabilityStatus = TraceabilityStatusEnum.UNFILLED;
        const promiseArr: Promise<unknown>[] = [];
        for (const traceability of traceabilities) {
          if (traceability.actId !== act.id) {
            traceability.actId = act.id;
            promiseArr.push(this.traceabilityRepo.save(traceability));
            if (traceability.reference) {
              traceabilityStatus = TraceabilityStatusEnum.FILLED;
            }
          }
        }
        await Promise.all(promiseArr);
      }
      act.traceabilityStatus = traceabilityStatus;
      await this.eventTaskRepo.save(act);
    }
    const messages = [];
    console.log('radiographies', act.patient);
    const radiographies: {
      id: number;
      name: string;
      coef: number;
      paragraphe: string;
    }[] = await this.dataSource.query(
      `
        SELECT
            T_EVENT_TASK_ETK.ETK_ID as id,
            T_EVENT_TASK_ETK.ETK_NAME as name,
            T_DENTAL_EVENT_TASK_DET.DET_COEF as coef,
            ccam_menu.paragraphe
        FROM T_EVENT_TASK_ETK
        JOIN T_DENTAL_EVENT_TASK_DET
        JOIN ccam
        JOIN ccam_menu
        WHERE
            T_EVENT_TASK_ETK.USR_ID = ? AND
            T_EVENT_TASK_ETK.CON_ID = ? AND
            T_EVENT_TASK_ETK.ETK_DATE = ? AND
            T_EVENT_TASK_ETK.ETK_STATE = 1 AND
            T_EVENT_TASK_ETK.ETK_ID = T_DENTAL_EVENT_TASK_DET.ETK_ID AND
            (T_DENTAL_EVENT_TASK_DET.DET_EXCEEDING IS NULL OR T_DENTAL_EVENT_TASK_DET.DET_EXCEEDING != ?) AND
            T_DENTAL_EVENT_TASK_DET.ccam_id = ccam.id AND
            ccam.ccam_menu_id = ccam_menu.id AND
            ccam_menu.paragraphe IN ('07.01.04.01', '11.01.03', '11.01.04')
        ORDER BY ETK_AMOUNT DESC`,
      [
        act.usrId,
        act.conId,
        dayjs(act.date).format('YYYY-MM-DD'),
        ExceedingEnum.NON_REMBOURSABLE,
      ],
    );
    const discountedCodes: string[] = [];
    if (radiographies.length > 0) {
      const reduceResult = radiographies.reduce((reduce, radiographie) => {
        return (
          reduce || ['11.01.03', '11.01.04'].includes(radiographie.paragraphe)
        );
      }, false);
      const promiseArr2 = [];
      if (reduceResult) {
        for (const [index, radiographie] of Object.entries(radiographies)) {
          if (!index) {
            promiseArr2.push(
              queryRunner.query(
                `UPDATE T_DENTAL_EVENT_TASK_DET SET association_code = 1 WHERE ETK_ID = ${radiographie.id}`,
              ),
            );
            if (Number(radiographie.coef) === 0.5) {
              promiseArr2.push(
                queryRunner.query(
                  `UPDATE T_DENTAL_EVENT_TASK_DET SET association_code = 1, DET_COEF = 1 WHERE ETK_ID = ${radiographie.id}`,
                ),
              );
              promiseArr2.push(
                queryRunner.query(
                  `UPDATE T_EVENT_TASK_ETK SET ETK_AMOUNT = ETK_AMOUNT * 2 WHERE ETK_ID = ${radiographie.id}`,
                ),
              );
            }
          } else if (Number(radiographie.coef) === 1) {
            promiseArr2.push(
              queryRunner.query(
                `UPDATE T_DENTAL_EVENT_TASK_DET SET association_code = 2, DET_COEF = 0.5 WHERE ETK_ID = ${radiographie.id}`,
              ),
            );
            promiseArr2.push(
              queryRunner.query(
                `UPDATE T_EVENT_TASK_ETK SET ETK_AMOUNT = ETK_AMOUNT / 2 WHERE ETK_ID = ${radiographie.id}`,
              ),
            );
            discountedCodes.push(radiographie.name);
          }
        }
      } else {
        for (const [index, radiographie] of Object.entries(radiographies)) {
          if (Number(radiographie.coef) === 0.5) {
            promiseArr2.push(
              queryRunner.query(
                `UPDATE T_DENTAL_EVENT_TASK_DET SET association_code = NULL, DET_COEF = 1 WHERE ETK_ID = ${radiographie.id}`,
              ),
            );
            promiseArr2.push(
              queryRunner.query(
                `UPDATE T_EVENT_TASK_ETK SET ETK_AMOUNT = ETK_AMOUNT * 2 WHERE ETK_ID = ${radiographie.id}`,
              ),
            );
          }
        }
      }
      await Promise.all(promiseArr2);
    }
    for (const discountedCode of discountedCodes) {
      //@TODO translate
      //   $messages[] = $translator->trans('prestation.warning.associationRadiographie', [
      //     '%name%' => $discountedCode,
      // ]);
      messages.push(
        `L'acte ${discountedCode} va être facturé à 50% car il s'agit d'un acte de radiographie conventionnelle et doit être décoté par rapport à l'acte de radiographie le plus cher effectué lors de la séance.`,
      );
    }
    return { id: lastInsertId, messages: messages };
  }
}
