import { add, format } from 'date-fns';
import { findWhere, groupBy } from 'src/common/util/array';
import { startOf } from 'src/common/util/datetime';
import { DataSource } from 'typeorm';
import { FilterValuesStatisticDto } from '../dto';

export class StatisticsService {
  constructor(
    private DataSource: DataSource,

    protected sqlFormats: Record<string, string> = {
      year: '%Y',
      month: '%Y-%m',
      week: '%Y-%v',
      day: '%Y-%m-%d',
    },
  ) {}

  public getSqlFormat(aggregate): string {
    return this.sqlFormats[aggregate];
  }

  public getDates(param: FilterValuesStatisticDto): string[] {
    const dates: string[] = [];
    const aggregate = param.aggregate;
    let startDatetime = new Date(param.start_date);
    const endDatetime = new Date(param.end_date);

    while (startDatetime <= endDatetime) {
      startOf(startDatetime, aggregate);
      dates.push(format(startDatetime, 'yyyy-MM-dd'));
      startDatetime = add(startDatetime, {
        years: aggregate === 'year' ? 1 : 0,
        months: aggregate === 'month' ? 1 : 0,
        weeks: aggregate === 'week' ? 1 : 0,
        days: aggregate === 'day' ? 1 : 0,
      });
    }

    return dates;
  }

  protected sortByDate(a: any, b: any): number {
    if (a.date < b.date) {
      return -1;
    } else if (a.date > b.date) {
      return 1;
    } else {
      return 0;
    }
  }

  protected insertMissingData(
    datas: any[],
    defaults: any,
    param: FilterValuesStatisticDto,
  ): void {
    const dates = this.getDates(param);
    while (dates.length > 0) {
      const date = dates.shift();
      const data = { date };
      if (!findWhere(datas, data)) {
        datas.push({ date, ...defaults });
      }
    }

    datas.map((data, index) => {
      datas[index] = { ...defaults, ...data };
    });
    // Sắp xếp dữ liệu theo ngày
    datas.sort(this.sortByDate);
  }

  protected extra(datas: any[], defaults: any): any {
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

  protected group(datas: any[]): any[] {
    const temp: any[] = [];
    const groups = groupBy(datas, (row) => row.date);
    for (const key in groups) {
      if (Object.prototype.hasOwnProperty.call(groups, key)) {
        const group = groups[key];
        const data: any = { date: key };
        group.forEach((child: any) => {
          data[child.group_by] = child.group_value;
        });
        temp.push(data);
      }
    }

    return temp;
  }

  public toArray(
    datas: any[],
    defaults: string[] | number[],
    param: FilterValuesStatisticDto,
    group?: boolean,
  ): any {
    const defaultsObj = Object.fromEntries(defaults.map((key) => [key, 0]));
    const aggregate = param?.aggregate;
    // Chỉnh sửa ngày tháng dựa trên loại tổng hợp
    datas.forEach((data) => {
      if (data && data.date) {
        const datetime = new Date(data?.date);
        startOf(datetime, aggregate);
        data['date'] = format(datetime, 'yyyy-MM-dd');
      }
    });
    // Nhóm dữ liệu
    if (group) {
      datas = this.group(datas);
    }

    // Chèn dữ liệu bị thiếu
    this.insertMissingData(datas, defaultsObj, param);

    return {
      data: datas,
      extra: this.extra(datas, defaultsObj),
    };
  }
}
