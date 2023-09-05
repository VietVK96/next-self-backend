import { Injectable } from '@nestjs/common';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { DataSource } from 'typeorm';
import { ListOfTreatmentsFindAllDto } from '../dto/list-of-treatments.dto';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { RequestException } from 'src/common/exceptions/request-exception.exception';

@Injectable()
export class ListOfTreatmentsService {
  constructor(private dataSource: DataSource) {}

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
}
