import { Injectable } from '@nestjs/common';
import { ContactEntity } from 'src/entities/contact.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource } from 'typeorm';
import * as dayjs from 'dayjs';
import { ExceedingEnum } from 'src/enum/exceeding-enum.enum';

@Injectable()
export class RadioAssociationService {
  constructor(private dataSource: DataSource) {}

  /**
   * application\Service\RadioAssociationService.php line 9->130
   */
  async calculHonoraires(
    practitioner: UserEntity,
    patient: ContactEntity,
    creationDate: string,
  ) {
    const radiographiesStm = this.dataSource
      .createQueryBuilder()
      .select(
        `
        T_EVENT_TASK_ETK.ETK_ID,
        T_EVENT_TASK_ETK.ETK_NAME,
        T_DENTAL_EVENT_TASK_DET.DET_COEF,
        ccam_menu.paragraphe
      `,
      )
      .from('T_EVENT_TASK_ETK', 'T_EVENT_TASK_ETK')
      .innerJoin('T_DENTAL_EVENT_TASK_DET', 'T_DENTAL_EVENT_TASK_DET')
      .innerJoin('ccam', 'ccam')
      .innerJoin('ccam_menu', 'ccam_menu')
      .where('T_EVENT_TASK_ETK.USR_ID = :usrId')
      .andWhere('T_EVENT_TASK_ETK.CON_ID = :conId')
      .andWhere('T_EVENT_TASK_ETK.ETK_DATE = :etkDate')
      .andWhere('T_EVENT_TASK_ETK.ETK_STATE = 1')
      .andWhere('T_EVENT_TASK_ETK.ETK_ID = T_DENTAL_EVENT_TASK_DET.ETK_ID')
      .andWhere(
        '(T_DENTAL_EVENT_TASK_DET.DET_EXCEEDING IS NULL OR T_DENTAL_EVENT_TASK_DET.DET_EXCEEDING != :detExceeding)',
      )
      .andWhere('T_DENTAL_EVENT_TASK_DET.ccam_id = ccam.id')
      .andWhere('ccam.ccam_menu_id = ccam_menu.id')
      .andWhere(
        `ccam_menu.paragraphe IN ('07.01.04.01', '11.01.03', '11.01.04')`,
      )
      .orderBy('ETK_AMOUNT', 'DESC')
      .setParameters({
        usrId: practitioner.id,
        conId: patient.id,
        etkDate: dayjs(creationDate).format('YYYY-MM-DD'),
        detExceeding: ExceedingEnum.NON_REMBOURSABLE,
      });

    const radiographies = await radiographiesStm.getRawMany();

    const discountedCodes = [];

    if (radiographies.length > 0) {
      if (
        radiographies.reduce((reduce, radiographie) => {
          return (
            reduce || ['11.01.03', '11.01.04'].includes(radiographie.paragraphe)
          );
        }, false)
      ) {
        let etkIdOfFirstRadiographie = 0;
        let isUpdateDetCoef = false;
        const etkIds = [];

        radiographies.forEach((radiographie, index) => {
          if (!index) {
            etkIdOfFirstRadiographie = radiographie.ETK_ID;
            if (radiographie.DET_COEF === 0.5) {
              isUpdateDetCoef = true;
            }
          } else if (radiographie.DET_COEF === 1) {
            etkIds.push(radiographie.ETK_ID);
            discountedCodes.push(radiographie.ETK_NAME);
          }
        });

        if (etkIdOfFirstRadiographie) {
          await this.dataSource.query(
            `UPDATE T_DENTAL_EVENT_TASK_DET SET association_code = 1 WHERE ETK_ID = ?`,
            [etkIdOfFirstRadiographie],
          );

          if (isUpdateDetCoef) {
            await this.dataSource.query(
              `UPDATE T_DENTAL_EVENT_TASK_DET SET association_code = 2, DET_COEF = 0.5 WHERE ETK_ID = ?`,
              [etkIdOfFirstRadiographie],
            );
            await this.dataSource.query(
              `UPDATE T_EVENT_TASK_ETK SET ETK_AMOUNT = ETK_AMOUNT * 2 WHERE ETK_ID = ?`,
              [etkIdOfFirstRadiographie],
            );
          }
        }

        if (etkIds && etkIds.length > 0) {
          await this.dataSource.query(
            `UPDATE T_DENTAL_EVENT_TASK_DET SET association_code = 2, DET_COEF = 0.5 WHERE ETK_ID IN (?)`,
            [etkIds.join(',')],
          );
          await this.dataSource.query(
            `UPDATE T_EVENT_TASK_ETK SET ETK_AMOUNT = ETK_AMOUNT / 2 WHERE ETK_ID IN (?)`,
            [etkIds.join(',')],
          );
        }
      } else {
        const etkIds = [];
        radiographies.forEach((radiographie) => {
          if (radiographie.DET_COEF === 0.5) {
            etkIds.push(radiographie.ETK_ID);
          }
        });

        if (etkIds && etkIds.length > 0) {
          await this.dataSource.query(
            `UPDATE T_DENTAL_EVENT_TASK_DET SET association_code = NULL, DET_COEF = 1 WHERE ETK_ID IN (?)`,
            [etkIds.join(',')],
          );
          await this.dataSource.query(
            `UPDATE T_EVENT_TASK_ETK SET ETK_AMOUNT = ETK_AMOUNT * 2 WHERE ETK_ID IN (?)`,
            [etkIds.join(',')],
          );
        }
      }
    }

    return discountedCodes;
  }
}
