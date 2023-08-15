import { Injectable } from '@nestjs/common';
import { DataSource, MoreThan, Repository, In, Not } from 'typeorm';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { CheckPriceStructDto } from '../dto/event-task.dto';
import { UserEntity } from 'src/entities/user.entity';
import { ExceedingEnum } from 'src/enum/exceeding-enum.enum';
import { CcamUnitPriceEntity } from 'src/entities/ccamunitprice.entity';
import { ShowActionExceptionFilter } from 'src/common/exceptions/show-action.exception';
import { InjectRepository } from '@nestjs/typeorm';
import { CodeNatureAssuranceEnum } from 'src/constants/act';
import { PanachagePaniersSoinsDto } from '../dto/panachage-paniers-soins.dto';
import {
  CheckHBJDCCcamCodeDto,
  CheckHBMDCcamCodeDto,
  CheckHBQKCcamCodeDto,
} from '../dto/check-ccam-code.dto';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { CheckHBJDCCcamCodeRes } from '../res/check-ccam-code.res';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class EventTaskService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(EventTaskEntity)
    private eventTaskRepo: Repository<EventTaskEntity>,
  ) {}

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

  async checkMaximumPrice(request: CheckPriceStructDto) {
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

  async getExamen(id: number) {
    const data = await this.eventTaskRepo
      .createQueryBuilder('act')
      .innerJoin('act.medical', 'medical')
      .innerJoin('medical.ngapKey', 'ngapKey')
      .where(
        `act.conId = :conId AND act.status > 0 AND medical.codeNatureAssurance <> :codeNatureAssurance AND ngapKey.name IN ('BDC', 'BR2', 'BR4', 'BRP', 'BDX') `,
        {
          conId: id,
          codeNatureAssurance: CodeNatureAssuranceEnum.MATERNITE,
        },
      )
      .select('act.ETK_ID as id, act.ETK_DATE as date')
      .orderBy('act.ETK_DATE', 'DESC')
      .getRawMany<EventTaskEntity>();
    return data;
  }

  async getDetartrages(id: number) {
    const data = await this.eventTaskRepo
      .createQueryBuilder('act')
      .innerJoin('act.medical', 'medical')
      .innerJoin('medical.ccam', 'ccam')
      .where(
        `act.conId = :conId AND
          act.status > 0 AND
          (medical.exceeding IS NULL OR medical.exceeding != :exceeding)
         AND ccam.code = 'HBJD001'`,
        {
          conId: id,
          exceeding: ExceedingEnum.NON_REMBOURSABLE,
        },
      )
      .select('act.ETK_ID as id, act.ETK_DATE as date')
      .orderBy('act.ETK_DATE', 'DESC')
      .getRawMany<EventTaskEntity>();
    return data;
  }

  async panachagePaniersSoins(
    id: number,
    payload: PanachagePaniersSoinsDto,
  ): Promise<{
    warning: boolean;
  }> {
    const data = await this.dataSource.query<{ countPana: number }[]>(
      `
SELECT COUNT(*) as countPana
        FROM T_EVENT_TASK_ETK
        JOIN T_DENTAL_EVENT_TASK_DET
        JOIN ccam
        JOIN ccam_family
        JOIN ccam_panier 
        WHERE 
            T_EVENT_TASK_ETK.CON_ID = ? AND
            T_EVENT_TASK_ETK.ETK_STATE > 0 AND
            T_EVENT_TASK_ETK.ETK_ID = T_DENTAL_EVENT_TASK_DET.ETK_ID AND
            T_DENTAL_EVENT_TASK_DET.DET_TOOTH = ? AND
            T_DENTAL_EVENT_TASK_DET.ccam_id = ccam.id AND
            ccam.ccam_family_id = ccam_family.id AND
            ccam_family.ccam_panier_id = ccam_panier.id AND
            ccam_panier.code != ?
`,
      [id, payload.tooth_numbers, payload.ccam_panier_code],
    );
    return {
      warning: data && data.length > 0 && data[0].countPana > 0,
    };
  }

  async checkHBJDCcamCode(
    id: number,
    payload: CheckHBJDCCcamCodeDto,
  ): Promise<CheckHBJDCCcamCodeRes> {
    const data = await this.dataSource.query<
      {
        dateOfPrestation: string;
        dateTzOfPrestation: string;
      }[]
    >(
      `SELECT EVT.EVT_START as dateOfPrestation,
           EVT.EVT_START_TZ as dateTzOfPrestation
	FROM T_EVENT_EVT EVT
	JOIN T_EVENT_TASK_ETK ETK ON ETK.EVT_ID = EVT.EVT_ID AND ETK.ETK_STATE > 0
	JOIN T_DENTAL_EVENT_TASK_DET DET ON DET.ETK_ID = ETK.ETK_ID AND DET.DET_CCAM_CODE REGEXP '^HBJD'
	WHERE EVT.CON_ID = ?
	  AND EVT.EVT_DELETE = 0
	  AND EVT.EVT_START IS NOT NULL
	ORDER BY EVT.EVT_START DESC`,
      [id],
    );

    let confirm = false;
    let sameDate = false;
    let numPrestation = 1;
    if (data && data.length > 0) {
      const dateOfPrestation = dayjs(payload.date);
      let datePrestation = dayjs(payload.date);

      for (const d of data) {
        const prestationLocal = dayjs(d.dateOfPrestation);
        const prestation = prestationLocal.tz(d.dateTzOfPrestation);
        const diff = dateOfPrestation.diff(prestation, 'days');
        if (diff === 0) {
          confirm = true;
          sameDate = true;
          break;
        }

        const diffMonth = dateOfPrestation.diff(prestation, 'months');
        if (diffMonth < 6) {
          datePrestation = prestation;
          confirm = true;
          numPrestation++;
        } else {
          break;
        }
      }
    }
    return {
      confirm,
      sameDate,
      nonRefundable: numPrestation > 2,
    };
  }

  async checkHBQKCcamCode(
    id: number,
    payload: CheckHBQKCcamCodeDto,
  ): Promise<{
    confirm: boolean;
  }> {
    const nums =
      payload?.teeth
        ?.toString()
        .split(/[^0-9]+/)
        .map((n) => Number(n)) ?? [];
    let confirm = false;
    const configNumsContiguous = [
      [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
      [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
      [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
      [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
    ];
    const dateOfPrestation = dayjs(payload?.date ?? '');
    const data = await this.dataSource.query<
      {
        detTooth: string;
      }[]
    >(
      `SELECT DET.DET_TOOTH as detTooth
	FROM T_EVENT_EVT EVT
	JOIN T_EVENT_TASK_ETK ETK ON ETK.EVT_ID = EVT.EVT_ID AND ETK.ETK_STATE > 0
	JOIN T_DENTAL_EVENT_TASK_DET DET ON DET.ETK_ID = ETK.ETK_ID AND DET.DET_CCAM_CODE REGEXP '^HBQK'
	WHERE EVT.CON_ID = ?
	  AND EVT.EVT_DELETE = 0
	  AND DATE(EVT.EVT_START) = DATE(?)`,
      [id, dateOfPrestation.format('YYYY-MM-DD')],
    );
    if (data && data.length > 0) {
      for (const d of data) {
        const prestationNums =
          d?.detTooth
            ?.toString()
            .split(/[^0-9]+/)
            .map((n) => Number(n)) ?? [];
        const prestationNumMerged = nums.concat(prestationNums);
        for (const num of prestationNumMerged) {
          for (const numContiguous of configNumsContiguous) {
            const len = numContiguous.length;
            const indexOf = numContiguous.indexOf(num);
            if (indexOf != -1) {
              // Récupération des dents contigües afin de les comparer
              // aux autres dents selectionnées.
              const uniq = Array.from(
                new Set([
                  numContiguous[Math.max(0, indexOf - 1)],
                  numContiguous[indexOf],
                  numContiguous[Math.min(len - 1, indexOf + 1)],
                ]),
              );
              const without = uniq.filter((u) => u !== num);
              const intersection = without.filter((w) => nums.includes(w));
              if (intersection.length > 0) {
                confirm = true;
              }
            }
          }
        }
      }
    }

    return {
      confirm,
    };
  }

  async checkHBMDCcamCode(
    id: number,
    payload: CheckHBMDCcamCodeDto,
  ): Promise<{
    confirm: boolean;
  }> {
    const dateOfPrestation = dayjs(payload?.date ?? '');
    let confirm = false;
    const data = await this.dataSource.query<
      {
        detCcamCode: string;
      }[]
    >(
      `SELECT DET.DET_CCAM_CODE as detCcamCode
	FROM T_EVENT_EVT EVT
	JOIN T_EVENT_TASK_ETK ETK ON ETK.EVT_ID = EVT.EVT_ID AND ETK.ETK_STATE > 0
	JOIN T_DENTAL_EVENT_TASK_DET DET ON DET.ETK_ID = ETK.ETK_ID AND (DET.DET_CCAM_CODE REGEXP '^HBLD' OR DET.DET_CCAM_CODE IN ('HBMD479', 'HBMD433', 'HBMD342', 'HBMD490'))
	WHERE EVT.CON_ID = ?
	  AND EVT.EVT_DELETE = 0
	  AND DATE(EVT.EVT_START) = DATE(?)
	ORDER BY ETK.ETK_POS DESC`,
      [id, dateOfPrestation.format('YYYY-MM-DD')],
    );
    if (data && data.length > 0) {
      for (const d of data) {
        if (d.detCcamCode.match(/^HBLD/)) {
          confirm = true;
          break;
        }
      }
    }
    return {
      confirm,
    };
  }
}
