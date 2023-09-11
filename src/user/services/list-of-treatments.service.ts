import { Injectable } from '@nestjs/common';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
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
import { br2nl, nl2br } from '../../common/util/string';
import { checkDay } from '../../common/util/day';

@Injectable()
export class ListOfTreatmentsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async findAll(identity: UserIdentity, body: ListOfTreatmentsFindAllDto) {
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
        .where('etk.user = :user', { user: identity.id })
        .andWhere('etk.status > :status', { status: 0 });
      if (body.conditions)
        this.addConditions(sumOfAmountQueryBuilder, body?.conditions);

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
        .where(`etk.user = ${identity.id}`)
        .andWhere('etk.status > 0')
        .groupBy('etk.id')
        .orderBy('etk.date', 'DESC')
        .addOrderBy('etk.createdAt', 'ASC');
      this.addConditions(queryBuilder, body?.conditions, true);

      const total = await queryBuilder.getCount();

      const pageSize = body?.rp || 50;
      const offset = (body?.page ? Number(body.page) - 1 : 0) * pageSize;
      const sql = queryBuilder.getSql().concat(` LIMIT ${offset},${pageSize}`);
      const data = await this.dataSource.query(sql);

      const respon: ListTreatmentRes = {
        page: body?.page ? Number(body.page) : 1,
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
        const contactLastname = value?.lastname;
        const contactFirstname = value?.firstname;
        const contactFullname = [contactLastname, contactFirstname]
          .filter(Boolean)
          .join(' ');
        const name = value?.name;
        const amount = value?.amount
          ? parseFloat(value?.amount.toString()).toFixed(2)
          : '0.00';
        const type = value?.type;
        const teeth = value?.teeth ? value.teeth.toString() : '';

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
            caresheetNbr = 'FS';
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
  ): string[] {
    let aliasNumber = 0;
    const alias = 'alias';
    const params: string[] = [];

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

    return params;
  }

  private async fetchEventTask(identity: UserIdentity, conditions: any) {
    const queryBuilder = this.dataSource
      .getRepository(EventTaskEntity)
      .createQueryBuilder('etk')
      .select([
        'etk.date',
        'con.id',
        'con.nbr',
        'con.lastname',
        'con.firstname',
        'etk.name',
        'etk.amount',
        'etk.ccamFamily',
        'det.coef',
        'det.teeth',
        'det.code',
        'det.type',
        'ngapKey.name AS ngap_key_name',
        'fse.date as caresheetDate',
        'fse.nbr as caresheetNbr',
      ])
      .innerJoin('etk.contact', 'con')
      .leftJoin('etk.event', 'evt', 'evt.delete = :deleteStatus', {
        deleteStatus: 0,
      })
      .leftJoin('etk.dental', 'det')
      .leftJoin('det.fse', 'fse')
      .leftJoin('det.ngapKey', 'ngapKey')
      .where('etk.user = :user', { user: identity?.id })
      .andWhere('etk.state > :status', { status: 0 })
      .groupBy('etk.id')
      .orderBy('etk.date', 'DESC')
      .addOrderBy('etk.createdAt');

    this.addConditions(queryBuilder, conditions);

    return await queryBuilder.getMany();
  }

  async export(
    res: Response,
    identity: UserIdentity,
    params: ListOfTreatmentsFindAllDto,
  ) {
    try {
      const raws = await this.fetchEventTask(identity, params?.conditions);
      const data = [];
      for (const raw of raws) {
        let cotation = null;
        if (raw?.dental?.type === 'CCAM') {
          cotation = raw?.dental?.code;
        } else if (raw?.dental.type === 'NGAP') {
          cotation = [raw?.dental?.ngapKey?.name, raw?.dental?.coef].join(' ');
        } else {
          cotation = 'NPC';
        }

        const caresheetDate = raw?.dental?.fse?.date;
        let caresheetNbr = '';
        if (caresheetDate) {
          caresheetNbr = raw?.dental?.fse?.nbr;
          if (!caresheetNbr) {
            caresheetNbr = 'Feuille de soin papier';
          }
        }

        data.push({
          date: format(new Date(raw?.date), 'dd/MM/yyyy'),
          number: raw?.patient?.nbr,
          name: raw?.name || '',
          amount: raw?.amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          type: raw?.dental?.type,
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
      const parser = new Parser({ fields });
      const result = parser.parse(data);
      const currentDate = new Date();
      const datePart = format(currentDate, 'yyyyMMdd');
      const filename = `${datePart}_soins.csv`;
      res.header('Content-Type', 'text/csv');
      res.attachment(filename);
      res.status(200).send(result);
    } catch (error) {
      throw new RequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async print(identity: UserIdentity, params: ListOfTreatmentsFindAllDto) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: identity?.id },
      });
      const eventTasks = await this.fetchEventTask(
        identity,
        params?.conditions,
      );
      const numberOfRows = eventTasks.length || 0;
      let amountTotal = 0;
      const ets = [];

      const formatTeeth = (teeth: any) => {
        const maxLength = 15;
        const substrings = [];
        for (let i = 0; i < teeth.length; i += maxLength) {
          substrings.push(teeth.slice(i, i + maxLength));
        }
        return substrings.join('<br/>');
      };

      for (const raw of eventTasks) {
        let cotation = null;
        if (raw?.dental?.type === 'CCAM') {
          cotation = raw?.dental?.code;
        } else if (raw?.dental.type === 'NGAP') {
          cotation = [raw?.dental?.ngapKey?.name, raw?.dental?.coef].join(' ');
        } else {
          cotation = 'NPC';
        }

        const caresheetDate = raw?.dental?.fse?.date;
        let caresheetNbr = '';
        if (caresheetDate) {
          caresheetNbr = raw?.dental?.fse?.nbr;
          if (!caresheetNbr) {
            caresheetNbr = 'Feuille de soin papier';
          }
        }

        const contactFullname = `${raw?.patient?.lastname} ${raw?.patient?.firstname}`;
        amountTotal += raw?.amount;

        const teeth = formatTeeth(raw?.dental?.teeth);

        ets.push({
          date: format(new Date(raw?.date), 'dd/MM/yyyy'),
          number: raw?.patient?.nbr,
          name: raw?.name || '',
          amount: raw?.amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          type: raw?.dental?.type,
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
        footerTemplate: '',
        margin: {
          left: '5mm',
          top: '5mm',
          right: '5mm',
          bottom: '5mm',
        },
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

      return customCreatePdf({ files, options, helpers });
    } catch (error) {
      throw new RequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }
}
