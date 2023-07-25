import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { FilterValuesStatisticDto } from '../dto';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';

@Injectable()
export class StatisticsEventsService {
  constructor(
    private dataSource: DataSource,
    private statisticsService: StatisticsService,
  ) {}

  async getEventsObtainingDelay(inputs: FilterValuesStatisticDto) {
    try {
      const query = `
      SELECT
        event_occurrence_evo.created_at AS date,
        SUM(TIMESTAMPDIFF(
            MINUTE,
            event_occurrence_evo.created_at,
            CONCAT_WS(' ', event_occurrence_evo.evo_date, TIME(T_EVENT_EVT.EVT_START))
        )) / COUNT(*) AS "Délai d'obtention"
      FROM T_EVENT_EVT
      JOIN event_occurrence_evo
      WHERE T_EVENT_EVT.USR_ID = ?
        AND T_EVENT_EVT.EVT_ID = event_occurrence_evo.evt_id
        AND event_occurrence_evo.created_at BETWEEN ? AND ?
      GROUP BY DATE_FORMAT(event_occurrence_evo.created_at, ?)`;

      const datas = await this.dataSource.query(query, [
        inputs['doctor_id'],
        inputs['start_date'],
        inputs['end_date'],
        this.statisticsService.getSqlFormat(inputs?.aggregate),
      ]);
      const label = "Délai d'obtention";
      const description =
        'Intervalle de temps entre la date de prise de rendez-vous et celle du rendez-vous effectué';
      const res = await this.statisticsService.toArray(
        datas,
        ["Délai d'obtention"],
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

  async getProductivity(inputs: FilterValuesStatisticDto) {
    try {
      const query = `
        SELECT
          T_USER_PREFERENCE_USP.USP_FREQUENCY
        FROM T_USER_PREFERENCE_USP
        WHERE T_USER_PREFERENCE_USP.USR_ID = ?`;
      const frequency = await this.dataSource.query(query, [
        inputs['doctor_id'],
      ]);
      const frequencyFormat = frequency[0]?.USP_FREQUENCY;
      const periods: number[] = Array.from(
        { length: 60 / frequencyFormat },
        (_, index) => (index + 1) * frequencyFormat,
      );

      const queryData = `
        SELECT
          t1.date as date,
          LEAST(60, (CEIL(t1.duration / ${frequencyFormat}) * ${frequencyFormat})) as group_by,
          SUM(t1.amount) as group_value
        FROM (
          SELECT
            event_occurrence_evo.evo_date AS date,
            SUM(TIMESTAMPDIFF(
              MINUTE,
              T_EVENT_EVT.EVT_START,
              T_EVENT_EVT.EVT_END
            )) AS duration,
            SUM(IFNULL(T_EVENT_TASK_ETK.ETK_AMOUNT, 0)) AS amount
          FROM T_EVENT_EVT
          JOIN event_occurrence_evo
          LEFT OUTER JOIN T_EVENT_TASK_ETK ON (
            T_EVENT_TASK_ETK.CON_ID = T_EVENT_EVT.CON_ID AND
            T_EVENT_TASK_ETK.ETK_DATE = event_occurrence_evo.evo_date AND
            T_EVENT_TASK_ETK.ETK_STATE > 0
          )
          WHERE T_EVENT_EVT.USR_ID = ?
            AND T_EVENT_EVT.EVT_DELETE = 0
            AND T_EVENT_EVT.CON_ID IS NOT NULL
            AND T_EVENT_EVT.EVT_ID = event_occurrence_evo.evt_id
            AND event_occurrence_evo.evo_date BETWEEN ? AND ?
          GROUP BY event_occurrence_evo.evo_date, T_EVENT_EVT.CON_ID
        ) AS t1
        GROUP BY DATE_FORMAT(t1.date, ?), LEAST(60, (CEIL(t1.duration / ${frequencyFormat}) * ${frequencyFormat}))
        ORDER BY date, group_by`;

      const datas = await this.dataSource.query(queryData, [
        inputs['doctor_id'],
        inputs['start_date'],
        inputs['end_date'],
        this.statisticsService.getSqlFormat(inputs?.aggregate),
      ]);
      const label = 'Production horaire';
      const description =
        'Montant des actes réalisés par rapport à la durée des rendez-vous';
      const res = await this.statisticsService.toArray(
        datas,
        periods,
        inputs,
        true,
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

  async getEmergencies(inputs: FilterValuesStatisticDto) {
    try {
      const query = `
      SELECT
        event_occurrence_evo.evo_date AS date,
        SUM(T_EVENT_EVT.EVT_STATE = 4) * 100 / COUNT(*) AS "Taux de rendez-vous perturbants"
      FROM T_EVENT_EVT
      JOIN event_occurrence_evo
      WHERE T_EVENT_EVT.USR_ID = ?
        AND T_EVENT_EVT.EVT_DELETE = 0
        AND T_EVENT_EVT.EVT_ID = event_occurrence_evo.evt_id
        AND event_occurrence_evo.evo_date BETWEEN ? AND ?
      GROUP BY DATE_FORMAT(event_occurrence_evo.evo_date, ?)`;

      const datas = await this.dataSource.query(query, [
        inputs['doctor_id'],
        inputs['start_date'],
        inputs['end_date'],
        this.statisticsService.getSqlFormat(inputs?.aggregate),
      ]);
      const label = 'Taux de rendez-vous perturbants';
      const description = 'Pourcentage de rendez-vous en urgences';
      const res = this.statisticsService.toArray(
        datas,
        ['Taux de rendez-vous perturbants'],
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

  async getReliability(inputs: FilterValuesStatisticDto) {
    try {
      const query = `
      SELECT
        event_occurrence_evo.evo_date AS date,
        SUM(T_EVENT_EVT.EVT_STATE NOT IN (2, 3)) * 100 / COUNT(*) AS "Taux de fiabilité"
      FROM T_EVENT_EVT
      JOIN event_occurrence_evo
      WHERE T_EVENT_EVT.USR_ID = ?
        AND T_EVENT_EVT.EVT_DELETE = 0
        AND T_EVENT_EVT.EVT_ID = event_occurrence_evo.evt_id
        AND event_occurrence_evo.evo_date BETWEEN ? AND ?
      GROUP BY DATE_FORMAT(event_occurrence_evo.evo_date, ?)`;

      const datas = await this.dataSource.query(query, [
        inputs['doctor_id'],
        inputs['start_date'],
        inputs['end_date'],
        this.statisticsService.getSqlFormat(inputs?.aggregate),
      ]);
      const label = 'Taux de fiabilité';
      const description =
        "Pourcentage de rendez-vous n'ayant pas été annulés ou manqués";
      const res = await this.statisticsService.toArray(
        datas,
        ['Taux de fiabilité'],
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

  async getOccupancyRate(inputs: FilterValuesStatisticDto) {
    try {
      const query = `
      SELECT
      TIMESTAMPDIFF(
          MINUTE,
          CONCAT_WS(' ', CURDATE(), STR_TO_DATE(T_USER_PREFERENCE_USP.USP_HMD, '%H:%i')),
          CONCAT_WS(' ', CURDATE(), STR_TO_DATE(T_USER_PREFERENCE_USP.USP_HMF, '%H:%i'))
      ) +
      TIMESTAMPDIFF(
          MINUTE,
          CONCAT_WS(' ', CURDATE(), STR_TO_DATE(T_USER_PREFERENCE_USP.USP_HAD, '%H:%i')),
          CONCAT_WS(' ', CURDATE(), STR_TO_DATE(T_USER_PREFERENCE_USP.USP_HAF, '%H:%i'))
      ) AS timeslot
      FROM T_USER_PREFERENCE_USP
      WHERE T_USER_PREFERENCE_USP.USR_ID = 1`;
      const timeslotStatement = await this.dataSource.query(query);
      const timeslot = timeslotStatement[0]?.timeslot;

      const queryData = `
        SELECT
          event_occurrence_evo.evo_date AS date,
          SUM(TIMESTAMPDIFF(
              MINUTE,
              CONCAT_WS(' ', event_occurrence_evo.evo_date, TIME(T_EVENT_EVT.EVT_START)),
              CONCAT_WS(' ', event_occurrence_evo.evo_date, TIME(T_EVENT_EVT.EVT_END))
          )) AS "Taux d'occupation"
        FROM T_EVENT_EVT
        JOIN event_occurrence_evo
        WHERE T_EVENT_EVT.USR_ID = ?
          AND T_EVENT_EVT.EVT_DELETE = 0
          AND T_EVENT_EVT.EVT_ID = event_occurrence_evo.evt_id
          AND event_occurrence_evo.evo_date BETWEEN ? AND ?
          AND event_occurrence_evo.evo_exception = 0
        GROUP BY DATE_FORMAT(event_occurrence_evo.evo_date, ?)`;

      const datas = await this.dataSource.query(queryData, [
        inputs['doctor_id'],
        inputs['start_date'],
        inputs['end_date'],
        this.statisticsService.getSqlFormat(inputs?.aggregate),
      ]);
      const label = "Taux d'occupation";
      const description =
        'Pourcentage de rendez-vous par rapport à la plage horaire';
      const res = await this.statisticsService.toArray(
        datas,
        ["Taux d'occupation"],
        inputs,
      );

      for (let index = 0; index < res?.data?.length; index++) {
        const data = res?.data[index];
        const datetime = new Date(data?.date);
        const occupation = data["Taux d'occupation"];
        let days = 1;

        // Nombre de jour en fonction de la semaine,
        // du mois ou de l'année
        switch (inputs.aggregate) {
          case 'year':
            days = this.isLeapYear(datetime.getFullYear()) ? 366 : 365;
            break;
          case 'month':
            days = new Date(
              datetime.getFullYear(),
              datetime.getMonth() + 1,
              0,
            ).getDate();
            break;
          case 'week':
            days = 7;
            break;
        }
        // Calcul du taux d'occupation
        res.data[index]["Taux d'occupation"] =
          (occupation * 100) / (timeslot * days);
      }

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

  async isLeapYear(year: number): Promise<boolean> {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }
}
