import { Injectable } from '@nestjs/common';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { DataSource, Repository } from 'typeorm';
import { ListOfTreatmentsFindAllDto } from '../dto/list-of-treatments.dto';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { ErrorCode } from 'src/constants/error';
import { RequestException } from 'src/common/exceptions/request-exception.exception';
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

  async findAll(identity: UserIdentity, params: ListOfTreatmentsFindAllDto) {
    try {
      const sumOfAmountQueryBuilder = this.dataSource
        .getRepository(EventTaskEntity)
        .createQueryBuilder('etk')
        .select('SUM(etk.amount)')
        .innerJoin('etk.contact', 'con')
        .leftJoinAndSelect('etk.event', 'evt', 'evt.delete = :deleteFlag', {
          deleteFlag: 0,
        })
        .leftJoin('etk.dental', 'det')
        .leftJoin('det.fse', 'fse')
        .leftJoin('det.ngapKey', 'ngapKey')
        .where('etk.user = :user', { user: identity.id })
        .andWhere('etk.state > :status', { status: 0 });
      this.addConditions(sumOfAmountQueryBuilder, params?.conditions);

      const result = await sumOfAmountQueryBuilder.getRawOne();
      // $sumOfAmount = $sumOfAmountQueryBuilder->getQuery()->getSingleScalarResult();
      // $response->addCustom("totalAmount", $sumOfAmount);

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
          'det.coef',
          'det.teeth',
          'det.code',
          'det.type',
          'ngapKey.name AS ngap_key_name',
          'fse.date as caresheetDate',
          'fse.nbr as caresheetNbr',
          'ccamFamily.code as ccamFamilyCode',
          'ccamFamily.label as ccamFamilyTitle',
        ])
        .innerJoin('etk.contact', 'con')
        .leftJoin('etk.event', 'evt', 'evt.delete = :deleteFlag', {
          deleteFlag: 0,
        })
        .leftJoin('etk.dental', 'det')
        .leftJoin('det.fse', 'fse')
        .leftJoin('det.ngapKey', 'ngapKey')
        .leftJoin('det.ccam', 'ccam')
        .leftJoin('ccam.family', 'ccamFamily')
        .where('etk.user = :user', { user: identity?.id })
        .andWhere('etk.state > :status', { status: 0 })
        .groupBy('etk.id')
        .orderBy('etk.date', 'DESC')
        .addOrderBy('etk.createdAt', 'ASC');

      this.addConditions(queryBuilder, params?.conditions);
      const pageSize = params?.rp || 100;
      const offset = (params?.page - 1) * pageSize;
      return await queryBuilder.skip(offset).take(pageSize).getManyAndCount();
    } catch (error) {
      throw new RequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  private addConditions(queryBuilder: any, conditions: any[]): void {
    let aliasNumber = 0;
    const alias = 'alias';

    conditions.forEach((condition) => {
      const operator = condition.op;
      const field = condition.field;
      const value = condition.value;

      if (typeof queryBuilder.expr[operator] === 'function') {
        if (value === null) {
          queryBuilder.andWhere(queryBuilder.expr[operator](field));
        } else {
          aliasNumber++;
          queryBuilder.andWhere(
            queryBuilder.expr[operator](field, `:${alias}${aliasNumber}`),
          );
          queryBuilder.setParameter(`${alias}${aliasNumber}`, value);
        }
      }
    });
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
      const data = [];
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
          contactFullname,
        });
      }

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

      return customCreatePdf({ files, options });
    } catch (error) {
      throw new RequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }
}
