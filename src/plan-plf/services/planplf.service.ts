import { Injectable } from '@nestjs/common';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { DataSource } from 'typeorm';
import { PlanificationContactRes } from '../response/planification-contact.res';

@Injectable()
export class PlantPlfService {
  constructor(private readonly dataSource: DataSource) {}

  async getPlanificationContact(id: number): Promise<PlanificationContactRes> {
    try {
      const results = await this.dataSource.query(
        `SELECT
            PLF.PLF_ID id,
            PLF.PLF_NAME name,
            PLF.PLF_TYPE type,
            PLF.PLF_AMOUNT amount,
            PLF.PLF_MUTUAL_CEILING mutualCeiling,
            PLF.PLF_PERSON_REPAYMENT personRepayment,
            PLF.PLF_PERSON_AMOUNT personAmount,
            PLF.PLF_ACCEPTED_ON acceptedOn
        FROM T_PLAN_PLF PLF
        JOIN T_PLAN_EVENT_PLV PLV
        JOIN T_EVENT_EVT EVT
        WHERE PLF.PLF_TYPE = 'plan'
          AND PLF.PLF_ID = PLV.PLF_ID
          AND PLV.EVT_ID = EVT.EVT_ID
          AND EVT.CON_ID = ?
          AND (EVT.EVT_START IS NULL OR DATE(EVT.EVT_START) = '0000-00-00')
          AND (EVT.EVT_END IS NULL OR DATE(EVT.EVT_END) = '0000-00-00')
        GROUP BY PLF.PLF_ID
        ORDER BY PLF.created_at DESC`,
        [id],
      );

      const promises = results.map(async (iterator) => {
        const events = await this.dataSource.query(
          `SELECT
              evo.evo_id id,
              EVT.EVT_ID eventId,
              EVT.EVT_NAME name,
              PLV.PLV_DELAY delay,
              PLV.duration,
              NULL start,
              NULL end
          FROM T_PLAN_EVENT_PLV PLV
          JOIN T_EVENT_EVT EVT
          JOIN event_occurrence_evo evo
          WHERE PLV.PLF_ID = ?
            AND PLV.EVT_ID = EVT.EVT_ID
            AND EVT.EVT_ID = evo.evt_id
            AND (EVT.EVT_START IS NULL OR DATE(EVT.EVT_START) = '0000-00-00')
            AND (EVT.EVT_END IS NULL OR DATE(EVT.EVT_END) = '0000-00-00')`,
          [iterator?.id],
        );
        iterator.events = events;
      });

      await Promise.all(promises);

      return results;
    } catch {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }
  }
}
