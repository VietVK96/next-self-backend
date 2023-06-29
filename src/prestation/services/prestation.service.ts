import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FindAllPrestationStructDto } from '../dto/findAll.prestation.dto';
import { FindAllPrestationRes } from '../response/findAll.prestation.res';
import { ExceedingEnum } from '../../enum/exceeding-enum.enum';
import { FindPrestationStructDto } from '../dto/find.prestation.dto';

@Injectable()
export class PrestationService {
  constructor(private dataSource: DataSource) {}

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
              record.cotation = `${record.code} ${record.code}`;
            }
            break;
        }
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
}
