import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FindAllPrestationStructDto } from '../dto/findAll.prestation.dto';
import { FindAllPrestationRes } from '../response/findAll.prestation.res';
import { ExceedingEnum } from '../../enum/exceeding-enum.enum';
import { FindPrestationStructDto } from '../dto/find.prestation.dto';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { PermissionService } from 'src/user/services/permission.service';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { ErrorCode } from 'src/constants/error';
import { CForbiddenRequestException } from 'src/common/exceptions/forbidden-request.exception';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { RadioAssociationService } from './radio-association.service';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { PerCode } from 'src/constants/permissions';
import { ActDto } from '../dto/act.dto';
import { PrestationDto } from 'src/contact/dto/prestation.dto';

@Injectable()
export class PrestationService {
  constructor(
    private dataSource: DataSource,
    private permissionService: PermissionService,
    private radioAssociationService: RadioAssociationService,
  ) {}

  /**
   * php\contact\prestation\findAll.php 16 -> 78
   * @param payload
   * @param orgId
   */
  async findAll(
    payload: FindAllPrestationStructDto,
    orgId: number,
  ): Promise<any> {
    if (payload && payload.id) {
      const queryBuilder = this.dataSource.createQueryBuilder();

      const select = `
        ETK.ETK_ID id,
        ETK.ETK_NAME name,
        ETK.ETK_DATE date,
        ETK.ETK_AMOUNT amount,
        ETK.ETK_STATE state,
        ETK.ETK_MSG msg,
        ETK.traceability_status,
        DET.DET_TYPE nomenclature,
        DET.DET_TOOTH teeth,
        DET.DET_COEF coef,
        DET.DET_EXCEEDING exceeding,
        DET.DET_CCAM_CODE ccamCode,
        DET.DET_CCAM_TELEM ccamTelem,
        DET.DET_CCAM_MODIFIER ccamModifier,
        DET.exemption_code,
        DET.exceptional_refund,
        DET.DET_ALD ald,
        DET.DET_SECU_AMOUNT secuAmount,
        DET.FSE_ID caresheetId,
        ccam.id AS ccam_id,
        ccam.code AS ccam_code,
        ccam.repayable_on_condition AS ccam_repayable_on_condition,
        ngap_key.id AS ngap_key_id,
        ngap_key.name AS code,
        USR.USR_ID practitionerId,
        USR.USR_ABBR practitionerAbbr,
        USR.USR_LASTNAME practitionerLastname,
        USR.USR_FIRSTNAME practitionerFirstname
      `;

      queryBuilder
        .select(select)
        .from('T_EVENT_TASK_ETK', 'ETK')
        .innerJoin('T_CONTACT_CON', 'CON')
        .leftJoin('T_EVENT_EVT', 'EVT', 'EVT.EVT_ID = ETK.EVT_ID')
        .leftJoin('T_PLAN_EVENT_PLV', 'PLV', 'PLV.EVT_ID = EVT.EVT_ID')
        .leftJoin('T_PLAN_PLF', 'PLF', 'PLF.PLF_ID = PLV.PLF_ID')
        .leftJoin('T_DENTAL_EVENT_TASK_DET', 'DET', 'DET.ETK_ID = ETK.ETK_ID')
        .leftJoin('ccam', 'ccam', 'ccam.id = DET.ccam_id')
        .leftJoin('ngap_key', 'ngap_key', 'ngap_key.id = DET.ngap_key_id')
        .leftJoin('T_USER_USR', 'USR', 'USR.USR_ID = ETK.USR_ID')
        .where('ETK.CON_ID = :conId')
        .andWhere('ETK.CON_ID = CON.CON_ID')
        .andWhere('CON.organization_id = :orgId')
        .andWhere('(EVT.EVT_ID IS NULL OR EVT.EVT_DELETE = 0)')
        .andWhere(
          "(PLF.PLF_ID IS NULL OR (PLF.PLF_ACCEPTED_ON IS NOT NULL AND PLF.PLF_ACCEPTED_ON != '0000-00-00'))",
        )
        .orderBy('ETK.ETK_DATE IS NULL', 'DESC')
        .addOrderBy('ETK.ETK_DATE', 'DESC')
        .addOrderBy('ETK.created_at', 'DESC')
        .addOrderBy('ETK.ETK_ID', 'DESC')
        .setParameters({
          conId: payload.id,
          orgId: orgId,
        });

      const results: FindAllPrestationRes[] = await queryBuilder.getRawMany();
      const prestations: FindAllPrestationRes[] = results.map((record) => {
        switch (record.nomenclature) {
          case 'CCAM':
            record.cotation = record.ccamCode;
            if (record.exceeding !== ExceedingEnum.NON_REMBOURSABLE) {
              record.exception = Boolean(record.ccam_repayable_on_condition);
            }
            break;
          case 'NGAP':
            if (record.code) {
              record.cotation = `${record.code} ${record.coef}`;
            }
            break;
        }

        record['medical'] = {
          ald: !!record.ald,
        };
        delete record.ald;
        return record;
      });
      return prestations;
    }
  }

  /**
   * php\prestation\find.php line 9->15
   * @param payload
   */
  async find(payload: FindPrestationStructDto): Promise<any> {
    if (payload && payload.id) {
      return await this.getItem(payload.id);
    }
  }

  /**
   * application\Repositories\Prestation.php line 8->59
   * @param prestationId
   */
  async getItem(prestationId: number): Promise<any> {
    const queryBuilder = this.dataSource.createQueryBuilder();
    const select = `
      ETK.ETK_ID id,
      ETK.ETK_NAME name,
      ETK.ETK_DATE date,
      ETK.ETK_MSG msg,
      ETK.ETK_POS	pos,
      ETK.ETK_DURATION duration,
      ETK.ETK_AMOUNT amount,
      ETK.ETK_COLOR color,
      ETK.ETK_QTY qty,
      ETK.ETK_STATE state,
      ETK.ccam_family,
      DET.DET_ALD ald,
      DET.DET_TOOTH teeth,
      DET.DET_COEF coef,
      DET.DET_EXCEEDING exceeding,
      DET.DET_COMP comp,
      DET.DET_TYPE type,
      DET.DET_PURCHASE_PRICE purchasePrice,
      DET.DET_CCAM_CODE ccamCode,
      DET.DET_CCAM_OPPOSABLE ccamOpposable,
      DET.DET_CCAM_TELEM ccamTelem,
      DET.DET_CCAM_MODIFIER ccamModifier,
      DET.DET_SECU_AMOUNT secuAmount,
      DET.DET_SECU_REPAYMENT secuRepayment,
      DET.DET_MUTUAL_REPAYMENT_TYPE mutualRepaymentType,
      DET.DET_MUTUAL_REPAYMENT_RATE mutualRepaymentRate,
      DET.DET_MUTUAL_REPAYMENT mutualRepayment,
      DET.DET_MUTUAL_COMPLEMENT mutualComplement,
      DET.DET_PERSON_REPAYMENT personRepayment,
      DET.DET_PERSON_AMOUNT personAmount,
      ETK.USR_ID practitionerId,
      ETK.CON_ID contactId,
      ETK.EVT_ID eventId,
      DET.ngap_key_id,
      DET.FSE_ID caresheetId
    `;

    queryBuilder
      .select(select)
      .from('T_EVENT_TASK_ETK', 'ETK')
      .leftJoin('T_DENTAL_EVENT_TASK_DET', 'DET', 'DET.ETK_ID = ETK.ETK_ID')
      .where('ETK.ETK_ID = :etkId')
      .orderBy('ETK.ETK_POS')
      .setParameter('etkId', prestationId);

    const results = await queryBuilder.getRawMany();
    return results;
  }

  /**
   * php\prestation\delete.php line 15->113
   * @param id
   * @param identity
   */
  async delete(id: number, identity: UserIdentity) {
    try {
      // Vérification de la permission de suppression.
      if (
        !this.permissionService.hasPermission(
          PerCode.PERMISSION_DELETE,
          8,
          identity.id,
        )
      ) {
        throw new CForbiddenRequestException(ErrorCode.FORBIDDEN);
      }

      // Vérification de l'existance de l'acte
      const queryBuilder = this.dataSource
        .createQueryBuilder()
        .select(
          `
          T_EVENT_TASK_ETK.ETK_ID AS id,
          T_EVENT_TASK_ETK.CON_ID AS patient_id`,
        )
        .from('T_EVENT_TASK_ETK', 'T_EVENT_TASK_ETK')
        .leftJoin(
          'T_CONTACT_CON',
          'T_CONTACT_CON',
          'T_CONTACT_CON.CON_ID = T_EVENT_TASK_ETK.CON_ID AND T_CONTACT_CON.organization_id = :groupId',
          { groupId: identity.org },
        )
        .leftJoin(
          'T_USER_USR',
          'T_USER_USR',
          'T_USER_USR.USR_ID = T_EVENT_TASK_ETK.USR_ID AND T_USER_USR.organization_id = :orgId',
          { orgId: identity.org },
        )
        .where('T_EVENT_TASK_ETK.ETK_ID = :etkId', { etkId: id });

      const act: ActDto = await queryBuilder.getRawOne();

      // Acte non trouvé
      if (!act) {
        throw new CNotFoundRequestException(ErrorCode.NOT_FOUND);
      }

      const actEntities: EventTaskEntity[] = await this.dataSource
        .getRepository(EventTaskEntity)
        .find({
          where: {
            id: id,
          },
          relations: {
            event: true,
            user: true,
            patient: true,
          },
        });
      const actEntity: EventTaskEntity =
        actEntities && actEntities.length > 0 ? actEntities[0] : undefined;

      // Si l'acte fait partie d'un devis ou plan de traitement,
      // on modifie uniquement son état.
      const { count: etkCount } = await this.dataSource
        .createQueryBuilder()
        .select(`COUNT(*) as count`)
        .from('T_EVENT_TASK_ETK', 'T_EVENT_TASK_ETK')
        .innerJoin('T_EVENT_EVT', 'T_EVENT_EVT')
        .innerJoin('T_PLAN_EVENT_PLV', 'T_PLAN_EVENT_PLV')
        .innerJoin('T_PLAN_PLF', 'T_PLAN_PLF')
        .where('T_EVENT_TASK_ETK.ETK_ID = :etkId', { etkId: id })
        .andWhere('T_EVENT_TASK_ETK.EVT_ID = T_EVENT_EVT.EVT_ID')
        .andWhere('T_EVENT_EVT.EVT_ID = T_PLAN_EVENT_PLV.EVT_ID')
        .andWhere('T_PLAN_EVENT_PLV.PLF_ID = T_PLAN_PLF.PLF_ID')
        .getRawOne();

      if (Number(etkCount)) {
        await this.dataSource.query(
          `UPDATE T_EVENT_TASK_ETK SET ETK_STATE = 0 WHERE ETK_ID = ?`,
          [id],
        );
      } else {
        await this.dataSource
          .getRepository(EventTaskEntity)
          .createQueryBuilder()
          .softDelete()
          .where('ETK_ID = :id', { id: id })
          .execute();
      }

      /**
       * RÈGLES D’ASSOCIATION DES RADIOGRAPHIES EN MÉDECINE BUCCO-DENTAIRE.
       */
      await this.radioAssociationService.calculHonoraires(
        actEntity.user,
        actEntity.patient,
        actEntity.date,
      );

      // Traçabilité IDS
      if (actEntity.patient) {
        // @TODO Ids\Log:: write('Acte', $act -> getPatient() -> getId(), 3);
      }
    } catch (error) {
      throw new CBadRequestException(error?.response?.msg || error?.sqlMessage);
    }
  }

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
        payload?.coef,
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
