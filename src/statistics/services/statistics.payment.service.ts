import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { StatisticsPaymentDto } from '../dto/statistics.payment.dto';
import { StatisticSqlFormat } from 'src/constants/statistics';
import {
  add,
  addDays,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import { StatisticsService } from './statistic.service';

@Injectable()
export class StatisticsPaymentService {
  constructor(
    private dataSource: DataSource,
    private statisticsService: StatisticsService,
  ) {}

  /**
   * File php/statistics/payments/sales-revenues.php
   * Line 9 -> 36
   */

  async paymentSalesRevenues(param: StatisticsPaymentDto) {
    const label = "Chiffre d'Affaires";
    const description = 'Montant des actes réalisés';
    const sql = `
    SELECT
		T_EVENT_TASK_ETK.ETK_DATE AS date,
        SUM(T_EVENT_TASK_ETK.ETK_AMOUNT) AS "Chiffre d'affaires"
    FROM T_EVENT_TASK_ETK
    WHERE T_EVENT_TASK_ETK.USR_ID = ?
      AND T_EVENT_TASK_ETK.ETK_STATE > 0
      AND T_EVENT_TASK_ETK.ETK_DATE BETWEEN ? AND ?
    GROUP BY DATE_FORMAT(T_EVENT_TASK_ETK.ETK_DATE, ?)`;
    const dateFormat = StatisticSqlFormat[param?.aggregate];
    const dataQuery = await this.dataSource.query(sql, [
      param?.doctor_id,
      param?.start_date,
      param?.end_date,
      dateFormat,
    ]);
    const dataRes = this.statisticsService.toArray(
      dataQuery,
      [`Chiffre d'affaires`],
      param,
    );
    return {
      aggregate: param?.aggregate,
      data: dataRes.data,
      extra: dataRes.extra,
      description,
      label,
    };
  }

  /**
   * File php/statistics/payments/receipts-by-types.php
   * Line 9 -> 37
   */
  async paymentReceiptsByType(param: StatisticsPaymentDto) {
    const label = 'Par soins / prothèses';
    const description = 'Montant des honoraires payés, par soins ou prothèses';
    const sql = `
    SELECT
        T_CASHING_CSG.CSG_PAYMENT_DATE AS date,
        SUM(T_CASHING_CSG.amount_care) AS "Soins",
        SUM(T_CASHING_CSG.amount_prosthesis) AS "Protheses"
    FROM T_CASHING_CSG
    WHERE T_CASHING_CSG.USR_ID = ?
      AND T_CASHING_CSG.CSG_PAYMENT_DATE BETWEEN ? AND ?
    GROUP BY DATE_FORMAT(T_CASHING_CSG.CSG_PAYMENT_DATE, ?)`;
    const dateFormat = StatisticSqlFormat[param?.aggregate];
    const dataQuery = await this.dataSource.query(sql, [
      param?.doctor_id,
      param?.start_date,
      param?.end_date,
      dateFormat,
    ]);
    const dataRes = this.statisticsService.toArray(
      dataQuery,
      ['Soins', 'Protheses'],
      param,
    );
    return {
      aggregate: param?.aggregate,
      data: dataRes.data,
      extra: dataRes.extra,
      description,
      label,
    };
  }

  /**
   * File php/statistics/payments/receipts-by-choices.php
   * Line 9 -> 50
   */
  async paymentReceiptsByChoices(param: StatisticsPaymentDto) {
    const label = 'Par modes de paiement';
    const description = 'Montant des honoraires payés, par modes de paiement';
    const choicesSql = ` 
    SELECT
    COLUMN_TYPE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = ?
    AND TABLE_NAME = 'T_CASHING_CSG'
    AND COLUMN_NAME = 'CSG_PAYMENT'`;
    const choicesStatement = await this.dataSource.query(choicesSql, [
      this.dataSource.options.database,
    ]);

    const choices = choicesStatement[0]?.COLUMN_TYPE ?? '';
    const trimmedChoices = choices.substring(6, choices.length - 2).trim();
    const defaults = trimmedChoices.split("','");
    const sql = `
    SELECT
        T_CASHING_CSG.CSG_PAYMENT_DATE AS date,
        T_CASHING_CSG.CSG_PAYMENT AS group_by,
        SUM(T_CASHING_CSG.CSG_AMOUNT) AS group_value
    FROM T_CASHING_CSG
    WHERE T_CASHING_CSG.USR_ID = ?
      AND T_CASHING_CSG.CSG_PAYMENT_DATE BETWEEN ? AND ?
      AND T_CASHING_CSG.CSG_PAYMENT IS NOT NULL
    GROUP BY DATE_FORMAT(T_CASHING_CSG.CSG_PAYMENT_DATE, ?), T_CASHING_CSG.CSG_PAYMENT`;
    const dateFormat = StatisticSqlFormat[param?.aggregate];
    const dataQuery = await this.dataSource.query(sql, [
      param?.doctor_id,
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
      data: dataRes.data,
      extra: dataRes.extra,
      description,
      label,
    };
  }
}
