import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { FilterValuesStatisticDto } from '../dto';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { CcamFamilyEntity } from 'src/entities/ccamFamily.entity';

@Injectable()
export class StatisticsActsService {
  constructor(
    private dataSource: DataSource,
    private statisticsService: StatisticsService,
  ) {}

  async getCareSheets(inputs: FilterValuesStatisticDto) {
    try {
      const careSheetsQuery = `
      SELECT
          T_EVENT_TASK_ETK.ETK_DATE AS date,
          SUM(IF (T_FSE_FSE.FSE_ID IS NOT NULL AND T_FSE_FSE.FSE_NBR IS NOT NULL, T_EVENT_TASK_ETK.ETK_AMOUNT, 0)) AS 'Feuille de soins',
          SUM(IF (T_FSE_FSE.FSE_ID IS NOT NULL AND T_FSE_FSE.FSE_NBR IS NULL, T_EVENT_TASK_ETK.ETK_AMOUNT, 0)) AS 'Feuille de soins papier',
          SUM(IF (T_FSE_FSE.FSE_ID IS NULL, T_EVENT_TASK_ETK.ETK_AMOUNT, 0)) AS 'Non mis sur feuille de soins'
      FROM T_EVENT_TASK_ETK
      LEFT OUTER JOIN T_DENTAL_EVENT_TASK_DET ON T_DENTAL_EVENT_TASK_DET.ETK_ID = T_EVENT_TASK_ETK.ETK_ID
      LEFT OUTER JOIN T_FSE_FSE ON T_FSE_FSE.FSE_ID = T_DENTAL_EVENT_TASK_DET.FSE_ID
      WHERE T_EVENT_TASK_ETK.USR_ID = ?
        AND T_EVENT_TASK_ETK.ETK_STATE > 0
        AND T_EVENT_TASK_ETK.ETK_DATE BETWEEN ? AND ?
      GROUP BY DATE_FORMAT(T_EVENT_TASK_ETK.ETK_DATE, ?)`;

      const results = await this.dataSource.query(careSheetsQuery, [
        inputs['doctor_id'],
        inputs['start_date'],
        inputs['end_date'],
        this.statisticsService.getSqlFormat(inputs?.aggregate),
      ]);

      const datas = results.map((row: any) => ({
        date: row.date,
        'Feuille de soins': row['Feuille de soins'],
        'Feuille de soins papier': row['Feuille de soins papier'],
        'Non mis sur feuille de soins': row['Non mis sur feuille de soins'],
      }));
      const label = 'Par types de feuilles de soins';
      const description =
        'Montant des actes réalisés, mis ou non sur feuilles de soins';

      const res = this.statisticsService.toArray(
        datas,
        [
          'Feuille de soins',
          'Feuille de soins papier',
          'Non mis sur feuille de soins',
        ],
        inputs,
      );

      return {
        label,
        description,
        data: res.data,
        extra: res.extra,
        aggregate: inputs?.aggregate,
      };
    } catch (error) {
      throw new CBadRequestException(error.message);
    }
  }

  async getCCamFamilies(inputs: FilterValuesStatisticDto) {
    try {
      const careSheetsQuery = `
      SELECT
      T_EVENT_TASK_ETK.ETK_DATE AS date,
      ccam_family.code AS group_by,
      SUM(T_EVENT_TASK_ETK.ETK_AMOUNT) AS group_value
      FROM T_EVENT_TASK_ETK
      JOIN T_DENTAL_EVENT_TASK_DET
      JOIN ccam
      JOIN ccam_family
      WHERE T_EVENT_TASK_ETK.USR_ID = ?
        AND T_EVENT_TASK_ETK.ETK_STATE != 0
        AND T_EVENT_TASK_ETK.ETK_DATE BETWEEN ? AND ?
        AND T_EVENT_TASK_ETK.ETK_ID = T_DENTAL_EVENT_TASK_DET.ETK_ID
        AND T_DENTAL_EVENT_TASK_DET.ccam_id = ccam.id
        AND ccam.ccam_family_id = ccam_family.id
      GROUP BY DATE_FORMAT(date, ?), group_by`;

      const datas = await this.dataSource.query(careSheetsQuery, [
        inputs['doctor_id'],
        inputs['start_date'],
        inputs['end_date'],
        this.statisticsService.getSqlFormat(inputs?.aggregate),
      ]);

      const defaultsObject = await this.dataSource
        .createQueryBuilder(CcamFamilyEntity, 'CCAMFA')
        .select('code')
        .execute();
      const defaults = defaultsObject.map((v) => v.code);

      const label = 'Par codes de regroupement';
      const description =
        'Montant des actes réalisés, par codes de regroupement';

      const res = this.statisticsService.toArray(datas, defaults, inputs, true);

      return {
        label,
        description,
        data: res.data,
        extra: res.extra,
        aggregate: inputs?.aggregate,
      };
    } catch (error) {
      throw new CBadRequestException(error.message);
    }
  }
}
