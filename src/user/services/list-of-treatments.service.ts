import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder, Repository } from 'typeorm';
import {
  FindAllConditionsDto,
  ListOfTreatmentsFindAllDto,
} from '../dto/list-of-treatments.dto';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { ErrorCode } from 'src/constants/error';
import { RequestException } from 'src/common/exceptions/request-exception.exception';
import { checkEmpty } from 'src/common/util/string';
import {
  ListTreatmentRes,
  ListTreatmentRow,
} from '../res/list-of-treatment.res';
import * as dayjs from 'dayjs';
import type { Response } from 'express';
import { Parser } from 'json2csv';
import { format } from 'date-fns';
import { UserEntity } from '../../entities/user.entity';
import { customCreatePdf } from '../../common/util/pdf';
import { InjectRepository } from '@nestjs/typeorm';
import * as path from 'path';

@Injectable()
export class ListOfTreatmentsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async findAll(doctorId: number, params: ListOfTreatmentsFindAllDto) {
    try {
      const sumOfAmountQueryBuilder = this.dataSource
        .getRepository(EventTaskEntity)
        .createQueryBuilder('etk')
        .select('SUM(etk.amount) as sumOfAmount')
        .innerJoin('etk.patient', 'con')
        .leftJoin('etk.event', 'evt', 'evt.delete = :deleteFlag', {
          deleteFlag: 0,
        })
        .leftJoin('etk.dental', 'det')
        .leftJoin('det.fse', 'fse')
        .leftJoin('det.ngapKey', 'ngapKey')
        .where('etk.user = :user', { user: doctorId })
        .andWhere('etk.status > :status', { status: 0 });
      if (params.conditions)
        this.addConditions(sumOfAmountQueryBuilder, params?.conditions);

      const result: { sumOfAmount: string } =
        await sumOfAmountQueryBuilder.getRawOne();

      const queryBuilder = this.dataSource
        .getRepository(EventTaskEntity)
        .createQueryBuilder('etk')
        .select('etk.date as date')
        .addSelect('con.id as id')
        .addSelect('con.nbr as nbr')
        .addSelect('con.lastname as lastname')
        .addSelect('con.firstname as firstname')
        .addSelect('etk.name as name')
        .addSelect('etk.amount as amount')
        .addSelect('det.coef as coef')
        .addSelect('det.teeth as teeth')
        .addSelect('det.code as code')
        .addSelect('det.type as type')
        .addSelect('ngapKey.name AS ngap_key_name')
        .addSelect('fse.date as caresheetDate')
        .addSelect('fse.nbr as caresheetNbr')
        .addSelect('ccamFamily.code as ccamFamilyCode')
        .addSelect('ccamFamily.label as ccamFamilyTitle')
        .innerJoin('etk.patient', 'con')
        .leftJoin('etk.event', 'evt', 'evt.delete = 0')
        .leftJoin('etk.dental', 'det')
        .leftJoin('det.fse', 'fse')
        .leftJoin('det.ngapKey', 'ngapKey')
        .leftJoin('det.ccam', 'ccam')
        .leftJoin('ccam.family', 'ccamFamily')
        .where(`etk.user = ${doctorId}`)
        .andWhere('etk.status > 0')
        .groupBy('etk.id')
        .orderBy('etk.date', 'DESC')
        .addOrderBy('etk.createdAt', 'ASC');
      this.addConditions(queryBuilder, params?.conditions, true);

      const total = await queryBuilder.getCount();

      const pageSize = Number(params?.rp) || 50;
      const offset = (params?.page ? Number(params.page) - 1 : 0) * pageSize;
      const sql = queryBuilder.getSql().concat(` LIMIT ${offset},${pageSize}`);
      const data = await this.dataSource.query(sql);

      const respon: ListTreatmentRes = {
        page: params?.page ? Number(params.page) : 1,
        total,
        customs: {
          totalAmount: result.sumOfAmount ?? '0.00',
        },
        rows: [],
      };

      for (const value of data) {
        const dateAsString = value?.date
          ? dayjs(value.date).format('DD/MM/YYYY')
          : null;
        const contactId = value?.id;
        const contactNbr = value?.nbr;
        const contactLastname = value?.lastname ?? '';
        const contactFirstname = value?.firstname ?? '';
        const contactFullname = [contactLastname, contactFirstname]
          .filter(Boolean)
          .join(' ');
        const name = value?.name;
        const amount = value?.amount
          ? parseFloat(value?.amount.toString()).toFixed(2)
          : '0.00';
        const teeth = value?.teeth ? value.teeth.toString() : '';
        const type = value?.type;

        let cotation = '';
        switch (type) {
          case 'CCAM':
            cotation = value?.code;
            break;
          case 'NGAP':
            cotation = [value?.ngap_key_name, value?.coef]
              .filter(Boolean)
              .join(' ');
            break;
          default:
            cotation = 'NPC';
            break;
        }

        const caresheetDate = value?.caresheetDate;
        let caresheetNbr = '';
        if (caresheetDate !== null) {
          caresheetNbr = value?.caresheetNbr;
          if (caresheetNbr === null) {
            caresheetNbr = 'Feuille de soin papier';
          }
        }

        const row: ListTreatmentRow = {
          id: null,
          cell: [
            '',
            dateAsString,
            { contactId, contactNbr },
            contactFullname,
            name,
            caresheetNbr,
            teeth,
            cotation,
            { title: value?.ccamFamilyTitle, content: value?.ccamFamilyCode },
            amount,
          ],
        };
        respon.rows.push(row);
      }

      return respon;
    } catch (error) {
      throw new RequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  private addConditions(
    queryBuilder: SelectQueryBuilder<EventTaskEntity>,
    conditions: FindAllConditionsDto[],
    rawQr = false,
  ) {
    if (!conditions || conditions.length === 0) return;
    let aliasNumber = 0;
    const alias = 'alias';
    const operators = {
      gte: '>=',
      lte: '<=',
      eq: '=',
      like: 'like',
    };

    conditions.forEach((condition) => {
      const operator = condition.op;
      const field = condition.field;
      const value = condition.value;

      if (checkEmpty(value)) {
        queryBuilder.andWhere(`${field} ${operators[operator]} NULL`);
      } else if (rawQr) {
        queryBuilder.andWhere(`${field} ${operators[operator]} '${value}'`);
      } else {
        ++aliasNumber;
        queryBuilder.andWhere(
          `${field} ${operators[operator]} :${alias}${aliasNumber}`,
        );
        queryBuilder.setParameter(`${alias}${aliasNumber}`, value);
      }
    });
  }

  private async fetchEventTask(doctorId: number, conditions: any) {
    const queryBuilder = this.dataSource
      .getRepository(EventTaskEntity)
      .createQueryBuilder('etk')
      .select('etk.date as date')
      .addSelect('con.id as id')
      .addSelect('con.nbr as nbr')
      .addSelect('con.lastname as lastname')
      .addSelect('con.firstname as firstname')
      .addSelect('etk.name as name')
      .addSelect('etk.amount as amount')
      .addSelect('etk.ccamFamily as ccamFamily')
      .addSelect('det.coef as coef')
      .addSelect('det.teeth as teeth')
      .addSelect('det.code as code')
      .addSelect('det.type as type')
      .addSelect('ngapKey.name AS ngap_key_name')
      .addSelect('fse.date as caresheetDate')
      .addSelect('fse.nbr as caresheetNbr')
      .innerJoin('etk.patient', 'con')
      .leftJoin('etk.event', 'evt', 'evt.delete = 0')
      .leftJoin('etk.dental', 'det')
      .leftJoin('det.fse', 'fse')
      .leftJoin('det.ngapKey', 'ngapKey')
      .leftJoin('det.ccam', 'ccam')
      .leftJoin('ccam.family', 'ccamFamily')
      .where(`etk.user = ${doctorId}`)
      .andWhere('etk.status > 0')
      .groupBy('etk.id')
      .orderBy('etk.date', 'DESC')
      .addOrderBy('etk.createdAt', 'ASC');

    this.addConditions(queryBuilder, conditions);

    return await queryBuilder.getRawMany();
  }

  async export(
    res: Response,
    doctorId: number,
    params: ListOfTreatmentsFindAllDto,
  ) {
    try {
      const raws = await this.fetchEventTask(doctorId, params?.conditions);

      const data = [];
      for (const raw of raws) {
        const type = raw?.type;

        let cotation = '';
        switch (type) {
          case 'CCAM':
            cotation = raw?.code;
            break;
          case 'NGAP':
            cotation = [raw?.ngap_key_name, raw?.coef]
              .filter(Boolean)
              .join(' ');
            break;
          default:
            cotation = 'NPC';
            break;
        }

        const caresheetDate = raw?.caresheetDate;
        let caresheetNbr = '';
        if (caresheetDate !== null) {
          caresheetNbr = raw?.caresheetNbr;
          if (caresheetNbr === null) {
            caresheetNbr = 'Feuille de soin papier';
          }
        }

        const amount = raw?.amount
          ? parseFloat(raw?.amount.toString()).toFixed(2)
          : '0.00';

        data.push({
          date: raw?.date ? dayjs(raw.date).format('DD/MM/YYYY') : null,
          number: raw?.nbr,
          name: raw?.name,
          amount,
          type,
          cotation,
          caresheetNbr,
          ccamFamily: raw?.ccamFamily,
        });
      }

      const fields = [
        { label: 'Date', value: 'date' },
        { label: '#', value: 'value' },
        { label: 'Libellé', value: 'name' },
        { label: 'Dents', value: 'teeth' },
        { label: 'Cotation', value: 'cotation' },
        { label: 'Montant', value: 'amount' },
        { label: 'FS/FSE', value: 'caresheetNbr' },
        { label: 'Code Regroupement', value: 'ccamFamily' },
      ];
      const parser = new Parser({ fields, delimiter: ';' });
      const result = parser.parse(data);
      res.header('Content-Type', 'text/csv');
      res.status(200).send(result);
    } catch (error) {
      throw new RequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async print(doctorId: number, params: ListOfTreatmentsFindAllDto) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: doctorId },
      });
      if (!user) throw new RequestException(ErrorCode.NOT_FOUND_USER);

      const eventTasks = await this.fetchEventTask(
        doctorId,
        params?.conditions,
      );
      const numberOfRows = eventTasks.length || 0;
      let amountTotal = 0.0;
      const ets = [];

      for (const raw of eventTasks) {
        amountTotal += parseFloat(raw?.amount) ?? 0.0;
        let cotation = '';
        switch (raw.type) {
          case 'CCAM':
            cotation = raw?.code;
            break;
          case 'NGAP':
            cotation = [raw?.ngap_key_name, raw?.coef]
              .filter(Boolean)
              .join(' ');
            break;
          default:
            cotation = 'NPC';
            break;
        }

        const caresheetDate = raw?.caresheetDate;
        let caresheetNbr = '';
        if (caresheetDate !== null) {
          caresheetNbr = raw?.caresheetNbr;
          if (caresheetNbr === null) {
            caresheetNbr = 'Feuille de soin papier';
          }
        }

        const contactLastname = raw?.lastname ?? '';
        const contactFirstname = raw?.firstname ?? '';
        const contactFullname = [contactLastname, contactFirstname]
          .filter(Boolean)
          .join(' ');
        const name = raw?.name;
        const amount = raw?.amount
          ? parseFloat(raw?.amount.toString()).toFixed(2)
          : '0.00';
        const teeth = raw?.teeth ? raw.teeth.toString() : '';
        const dateAsString = raw?.date
          ? dayjs(raw.date).format('DD/MM/YYYY')
          : null;

        ets.push({
          date: dateAsString,
          number: raw?.nbr,
          name,
          amount,
          type: raw?.type,
          cotation,
          teeth,
          caresheetNbr,
          ccamFamily: raw?.ccamFamily,
          contactFullname,
        });
      }

      const data = {
        user,
        numberOfRows,
        amountTotal,
        ets,
      };

      const filePath = path.join(
        process.cwd(),
        'templates/pdf/list-of-treatments',
        'print.hbs',
      );

      const options = {
        format: 'A4',
        displayHeaderFooter: true,
        margin: {
          left: '10mm',
          top: '10mm',
          right: '10mm',
          bottom: '15mm',
        },
        headerTemplate: `<div></div>`,
        footerTemplate: `<div style="width: 100%;margin-right:10mm; text-align: right; font-size: 8px;">Document généré le ${format(
          new Date(),
          'dd/MM/yyyy',
        )} Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
        landscape: true,
      };
      const files = [{ path: filePath, data }];

      const helpers = {
        formatNumber: (n: number) => {
          return Number(n).toFixed(2);
        },
        formatTeeth: (teeth: any) => {
          const maxLength = 15;
          const substrings = [];
          for (let i = 0; i < teeth.length; i += maxLength) {
            substrings.push(teeth.slice(i, i + maxLength));
          }
          return substrings.join('<br/>');
        },
      };

      return await customCreatePdf({ files, options, helpers });
    } catch (error) {
      throw new RequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }
}
