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

@Injectable()
export class StatisticsService {
  constructor(private dataSource: DataSource) {}

  extra(datas: any[], defaults: any): any {
    const extra = {
      average: {},
      total: {},
    };
    const keys = Object.keys(defaults);
    keys.forEach((key) => {
      const inputs = datas.map((data) => data[key]);
      const total = inputs.reduce(
        (initial, value) => initial + parseFloat(value),
        0,
      );

      extra.average[key] = total / inputs.length;
      extra.total[key] = total;
    });

    return extra;
  }

  toArray(
    data: any[],
    defaults: string[],
    param: StatisticsPaymentDto,
    group?: boolean,
  ) {
    let dataRes = [];
    const defaultsObj = Object.fromEntries(defaults.map((key) => [key, 0]));
    const aggregate = param?.aggregate;
    dataRes = data?.map((item) => {
      let datetime = new Date(item['date']);
      datetime = this.__startOfStatistic(datetime, aggregate);
      item['date'] = format(datetime, 'yyyy-MM-dd');
      return item;
    });

    // Regroupement des données
    if (group) {
      dataRes = this.group(dataRes);
    }
    const dates = this.getDate(aggregate, param);
    while (dates.length > 0) {
      const date = dates.shift();
      const dataItem = dataRes.find((v) => v?.date === date);
      if (!dataItem) {
        dataRes.push({ ...defaultsObj, date });
      }
    }
    //Điền dữ liệu còn thiếu
    dataRes.map((data, index) => {
      dataRes[index] = { ...defaultsObj, ...data };
    });
    // Sắp xếp dữ liệu theo ngày
    dataRes.sort(
      (a, b) => new Date(a?.date).getTime() - new Date(b?.date).getTime(),
    );

    const extra = this.extra(dataRes, defaultsObj);
    return {
      data: dataRes,
      extra,
    };
  }

  getDate(aggregate: string, param: StatisticsPaymentDto) {
    const dates = [];
    let startDatetime = new Date(param?.start_date);
    const endDatetime = new Date(param?.end_date);
    while (startDatetime <= endDatetime) {
      startDatetime = this.__startOfStatistic(startDatetime, aggregate);
      dates.push(format(startDatetime, 'yyyy-MM-dd'));
      const duration: Duration = this.__getDateDuration(aggregate);
      startDatetime = add(new Date(startDatetime), duration);
    }
    return dates;
  }

  __getDateDuration(type: string) {
    let duration: Duration = {};
    switch (type) {
      case 'year':
        duration = { years: 1 };
        break;
      case 'month':
        duration = { months: 1 };
        break;
      case 'week':
        duration = { weeks: 1 };
        break;
      case 'day':
        duration = { days: 1 };
        break;
    }
    return duration;
  }

  __startOfStatistic(date: Date, unit: string) {
    const typeFormat = unit ? unit : 'month';
    let dateFormat = new Date(date);
    switch (typeFormat) {
      case 'year':
        dateFormat = startOfYear(date);
        break;
      case 'month':
        dateFormat = startOfMonth(date);
        break;
      case 'week':
        dateFormat = startOfWeek(date, { weekStartsOn: 1 });
        break;
      case 'day':
        dateFormat = startOfDay(date);
        break;
    }
    return dateFormat;
  }

  groupBy(
    array: any[],
    iterator: (item: any, index: number) => string,
  ): { [key: string]: any[] } {
    const result: { [key: string]: any[] } = {};

    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      const key = iterator(item, i);

      if (!result.hasOwnProperty(key)) {
        result[key] = [];
      }

      result[key].push(item);
    }

    return result;
  }

  group(datas: any[]): any[] {
    const temp = [];
    const groups = this.groupBy(datas, (row) => row.date);

    for (const key in groups) {
      if (groups.hasOwnProperty(key)) {
        const group = groups[key];
        const data = { date: key };

        for (const child of group) {
          data[child.group_by] = child.group_value;
        }

        temp.push(data);
      }
    }

    return temp;
  }
}
