import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import { StatisticSqlFormat } from 'src/constants/statistics';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { UserEntity } from 'src/entities/user.entity';
import { AccountStatusEnum } from 'src/enum/account-status.enum';
import { FilterValuesStatisticDto } from '../dto';
import { StatisticsService } from './statistics.service';

@Injectable()
export class StatisticsPatientService {
  constructor(
    private dataSource: DataSource,
    private statisticsService: StatisticsService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * File php/statistics/patients/index.php
   * Line 15 -> 71
   */

  async patientIndex(param: FilterValuesStatisticDto, identity: UserIdentity) {
    const label = 'Nombre de patients';
    const description = 'Nombre de patients par praticien';
    if (['day', 'week'].includes(param?.aggregate)) {
      throw new CBadRequestException(
        'Regroupements autorisés : par mois, par année',
      );
    }
    const users = await this.userRepository.find({
      where: {
        client: Not(AccountStatusEnum.TERMINATED),
        organizationId: identity.org,
      },
      relations: ['medical'],
      order: { lastname: 'ASC', firstname: 'ASC' },
    });

    const defaults = users.reduce((list, user) => {
      const fullName = `${user?.lastname ?? ''} ${user?.firstname ?? ''}`;
      if (user?.medical && !list.includes(fullName)) {
        return [...list, fullName];
      }
      return list;
    }, []);

    const sql = `
    SELECT
    t1.date,
    CONCAT_WS(' ', USR_LASTNAME, USR_FIRSTNAME) as group_by,
    t1.group_value
    FROM T_USER_USR
    JOIN (
    SELECT
        T_CONTACT_CON.created_at AS date,
        T_CONTACT_CON.USR_ID AS group_by,
        COUNT(T_CONTACT_CON.CON_ID) AS group_value
    FROM T_CONTACT_CON
    WHERE T_CONTACT_CON.organization_id = ?
    AND DATE(T_CONTACT_CON.created_at) BETWEEN ? AND ?
    GROUP BY DATE_FORMAT(date, ?),group_by
    ) AS t1
    WHERE T_USER_USR.USR_ID = t1.group_by`;
    const dateFormat = StatisticSqlFormat[param?.aggregate];
    const dataQuery = await this.dataSource.query(sql, [
      identity?.org,
      param?.start_date,
      param?.end_date,
      dateFormat,
    ]);

    const dataRes = this.statisticsService.toArray(
      dataQuery,
      defaults,
      param,
      true,
    );

    return {
      aggregate: param?.aggregate,
      data: dataRes?.data,
      extra: dataRes?.extra,
      description,
      label,
    };
  }

  /**
   * File php/statistics/patients/new.php
   * Line 15 -> 35
   */
  async patientNew(param: FilterValuesStatisticDto) {
    const label = 'Nouveaux patients';
    const description = 'Nombre de nouveaux patients';
    const sql = `
    SELECT
    T_CONTACT_CON.created_at AS date,
    COUNT(*) AS 'Nouveaux patients'
    FROM T_CONTACT_CON
    WHERE T_CONTACT_CON.USR_ID = ?
    AND DATE(T_CONTACT_CON.created_at) BETWEEN ? AND ?
    GROUP BY DATE_FORMAT(T_CONTACT_CON.created_at, ?)`;
    const dateFormat = StatisticSqlFormat[param?.aggregate];
    const dataQuery = await this.dataSource.query(sql, [
      param?.doctor_id,
      param?.start_date,
      param?.end_date,
      dateFormat,
    ]);
    const dataRes = this.statisticsService.toArray(
      dataQuery,
      ['Nouveaux patients'],
      param,
    );
    return {
      aggregate: param?.aggregate,
      data: dataRes?.data,
      extra: dataRes?.extra,
      description,
      label,
    };
  }

  /**
   * File /php/statistics/patients/children.php
   * Line 9 -> 47
   */
  async patientChildren(param: FilterValuesStatisticDto) {
    const label = 'Enfants / Adultes';
    const description = "Nombre d'enfants et d'adultes soignés";
    const sql = `SELECT
    t1.date AS date,
    SUM(age < 13) AS 'Enfants',
    SUM(age >= 13) AS 'Adultes'
    FROM (
    SELECT
        T_EVENT_TASK_ETK.ETK_DATE AS date,
        TIMESTAMPDIFF(YEAR, T_CONTACT_CON.CON_BIRTHDAY, T_EVENT_TASK_ETK.ETK_DATE) AS age
    FROM T_EVENT_TASK_ETK
    JOIN T_CONTACT_CON
    WHERE T_EVENT_TASK_ETK.USR_ID = ?
      AND T_EVENT_TASK_ETK.ETK_DATE BETWEEN ? AND ?
      AND T_EVENT_TASK_ETK.ETK_STATE > 0
      AND T_EVENT_TASK_ETK.CON_ID = T_CONTACT_CON.CON_ID
      AND T_CONTACT_CON.CON_BIRTHDAY IS NOT NULL
    GROUP BY T_EVENT_TASK_ETK.ETK_DATE, T_CONTACT_CON.CON_ID
    ) AS t1
    GROUP BY DATE_FORMAT(t1.date, ?)`;
    const dateFormat = StatisticSqlFormat[param?.aggregate];
    const dataQuery = await this.dataSource.query(sql, [
      param?.doctor_id,
      param?.start_date,
      param?.end_date,
      dateFormat,
    ]);
    const dataRes = this.statisticsService.toArray(
      dataQuery,
      ['Enfants', 'Adultes'],
      param,
    );
    return {
      aggregate: param?.aggregate,
      data: dataRes?.data,
      extra: dataRes?.extra,
      description,
      label,
    };
  }

  /**
   * File php/statistics/patients/average.php
   * Line 9 -> 45
   */
  async patientAverage(param: FilterValuesStatisticDto) {
    const label = 'Age moyen';
    const description = 'Age moyen des patients soignés';
    const sql = `
    SELECT
    t1.date AS date,
    SUM(t1.age) / COUNT(*) AS 'Age moyen'
    FROM (
      SELECT
        T_EVENT_TASK_ETK.ETK_DATE AS date,
        TIMESTAMPDIFF(YEAR, T_CONTACT_CON.CON_BIRTHDAY, T_EVENT_TASK_ETK.ETK_DATE) AS age
      FROM T_EVENT_TASK_ETK
      JOIN T_CONTACT_CON
      WHERE T_EVENT_TASK_ETK.USR_ID = ?
      AND T_EVENT_TASK_ETK.ETK_DATE BETWEEN ? AND ?
      AND T_EVENT_TASK_ETK.ETK_STATE > 0
      AND T_EVENT_TASK_ETK.CON_ID = T_CONTACT_CON.CON_ID
      AND T_CONTACT_CON.CON_BIRTHDAY IS NOT NULL
      GROUP BY T_EVENT_TASK_ETK.ETK_DATE, T_CONTACT_CON.CON_ID
    ) AS t1
    GROUP BY DATE_FORMAT(t1.date, ?)`;
    const dateFormat = StatisticSqlFormat[param?.aggregate];
    const dataQuery = await this.dataSource.query(sql, [
      param?.doctor_id,
      param?.start_date,
      param?.end_date,
      dateFormat,
    ]);
    const dataRes = this.statisticsService.toArray(
      dataQuery,
      ['Age moyen'],
      param,
    );
    return {
      aggregate: param?.aggregate,
      data: dataRes?.data,
      extra: dataRes?.extra,
      description,
      label,
    };
  }
}
