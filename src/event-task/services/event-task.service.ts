import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { CheckPriceStructDto } from '../dto/event-task.dto';
import { UserEntity } from 'src/entities/user.entity';
import { ExceedingEnum } from 'src/enum/exceeding-enum.enum';
import { CcamUnitPriceEntity } from 'src/entities/ccamunitprice.entity';
import { ShowActionExceptionFilter } from 'src/common/exceptions/show-action.exception';

@Injectable()
export class EventTaskService {
  constructor(private dataSource: DataSource) {}

  /**
   * File: php/acts/exceeds-maximum-price.php
   * @function main function
   *
   */

  private _canPerformFreeFee(user: UserEntity): boolean {
    if (user.droitPermanentDepassement) {
      return true;
    }
    if (user.amo) {
      return user.amo.codeConvention === 0;
    }
    return false;
  }

  private async _getUnitPrice(
    grid: number,
    date: string,
  ): Promise<CcamUnitPriceEntity> {
    return await this.dataSource
      .createQueryBuilder()
      .select()
      .from(CcamUnitPriceEntity, 'CcamUnit')
      .where(`CcamUnit.grid = ${grid}`)
      .andWhere(`CcamUnit.createdOn <= DATE("${date}")`)
      .orderBy('CcamUnit.createdOn', 'DESC')
      .take(1)
      .getRawOne();
  }

  async CheckMaximumPrice(request: CheckPriceStructDto) {
    try {
      const { id, amount } = request;
      const eventTask: EventTaskEntity[] = await this.dataSource.manager.find(
        EventTaskEntity,
        {
          where: { id },
          relations: {
            medical: {
              ccam: true,
            },
            user: {
              setting: true,
            },
          },
        },
      );
      const creationDate = eventTask[0].date;
      const ccamUnitPrice = await this._getUnitPrice(
        eventTask[0].user.setting?.priceGrid,
        creationDate,
      );
      if (
        this._canPerformFreeFee(eventTask[0].user) &&
        ExceedingEnum.NON_REMBOURSABLE &&
        eventTask[0].medical &&
        eventTask[0].user
      ) {
        if (
          ccamUnitPrice &&
          ccamUnitPrice?.maximumPrice &&
          amount > ccamUnitPrice?.maximumPrice
        ) {
          return {
            exceeds_maximum_price: true,
            maximumPrice: ccamUnitPrice?.maximumPrice,
          };
        }
      }
      return {
        exceeds_maximum_price: false,
      };
    } catch (error) {
      return new ShowActionExceptionFilter();
    }
  }
}
