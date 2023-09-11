import { Injectable } from '@nestjs/common';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import {
  FindAllConditionsDto,
  ListOfTreatmentsFindAllDto,
} from '../dto/list-of-treatments.dto';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { RequestException } from 'src/common/exceptions/request-exception.exception';
import { checkEmpty } from 'src/common/util/string';
import {
  ListTreatmentRes,
  ListTreatmentRow,
} from '../res/list-of-treatment.res';
import * as dayjs from 'dayjs';

@Injectable()
export class ListOfTreatmentsService {
  constructor(private dataSource: DataSource) {}

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
}
