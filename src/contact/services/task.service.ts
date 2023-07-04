import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { EventTaskDto, EventTaskPatchDto } from '../dto/task.contact.dto';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { ErrorCode } from 'src/constants/error';
import { DataSource } from 'typeorm';
import { ExceedingEnum } from 'src/enum/exceeding-enum.enum';
import { UserEntity } from 'src/entities/user.entity';
import { EnumDentalEventTaskComp } from 'src/entities/dental-event-task.entity';
import { DentalModifierEntity } from 'src/entities/dental-modifier.entity';
import { CcamUnitPriceEntity } from 'src/entities/ccamunitprice.entity';
import { CcamEntity } from 'src/entities/ccam.entity';
import { query } from 'express';
import * as dayjs from 'dayjs';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(EventTaskEntity)
    private eventTaskRepository: Repository<EventTaskEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(DentalModifierEntity)
    private dentalModifierRepository: Repository<DentalModifierEntity>,
    @InjectRepository(CcamUnitPriceEntity)
    private ccamUnitPriceRepository: Repository<CcamUnitPriceEntity>,
    @InjectRepository(CcamEntity)
    private ccamRepository: Repository<CcamEntity>,
    private dataSource: DataSource,
  ) {}

  async updateEventTask(payload: EventTaskDto) {
    if (
      !(await this.eventTaskRepository.find({
        where: { id: payload.id, conId: payload.user },
      }))
    ) {
      throw new CNotFoundRequestException(ErrorCode.STATUS_NOT_FOUND);
    }
    await this.eventTaskRepository.update(payload.id, { state: 0 });
  }

  // file: php/event/task/patch.php line 32-544
  // up date lai thong tin task cua event
  async updateTaskPatch({ name, pk, value }: EventTaskPatchDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let oldEventTask: EventTaskEntity = null;
    let oldComplement: EnumDentalEventTaskComp = null;
    let refreshAmount = false;
    const id: number = pk;
    // tao cac ham dung chung
    const canPerformFreeFee = (user: UserEntity): boolean => {
      if (user.droitPermanentDepassement === 1) {
        return true;
      }
      if (user.amo) {
        return user.amo.codeConvention === 0;
      }
      return false;
    };
    async function containsModifier(
      code: string,
      modifier: string,
      ccamRepository: Repository<CcamEntity>,
    ): Promise<boolean> {
      const queryBuilder = ccamRepository.createQueryBuilder('ccam');
      queryBuilder.select('COUNT(ccam.id)', 'count');
      queryBuilder.where('ccam.code = :code', { code });
      queryBuilder.andWhere('ccam.modifiers LIKE :modifiers', {
        modifiers: `%${modifier.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`,
      });

      const result = await queryBuilder.getRawOne();
      const count = Number(result.count);
      return Boolean(count);
    }

    try {
      // modification des attributs de l'acte du rendez-vous
      switch (name) {
        case 'name':
          // Modification du libellé
          await queryRunner.query(
            ` UPDATE T_EVENT_TASK_ETK
          SET ETK_NAME = ?
          WHERE ETK_ID = ?`,
            [value, id],
          );
          break;

        case 'msg':
          // Modification de la description
          await queryRunner.query(
            ` UPDATE T_EVENT_TASK_ETK
          SET ETK_MSG = ?
          WHERE ETK_ID = ?`,
            [value, id],
          );
          break;

        case 'date':
          // Modification du complément prestation
          oldEventTask = await this.eventTaskRepository.findOneBy({ id: id });

          // Modification de la date
          await queryRunner.query(
            ` UPDATE T_EVENT_TASK_ETK
          SET ETK_DATE = ?
          WHERE ETK_ID = ?`,
            [value, id],
          );
          break;

        case 'teeth':
          // Modification des dents
          await queryRunner.query(
            `INSERT INTO T_DENTAL_EVENT_TASK_DET (ETK_ID, DET_TOOTH)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE
          DET_TOOTH = VALUES(DET_TOOTH)`,
            [id, value],
          );
          break;

        case 'cotationNgap':
          // Modification de la cotation NGAP
          const ngapKeyId = value['ngap_key_id'];
          const coefficient = value['coef'];

          await queryRunner.query(
            `INSERT INTO T_DENTAL_EVENT_TASK_DET (ETK_ID, ngap_key_id, DET_COEF)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
          ngap_key_id = VALUES(ngap_key_id),
          DET_COEF = VALUES(DET_COEF)`,
            [id, ngapKeyId, coefficient],
          );
          refreshAmount = true;
          break;

        case 'code':
        case 'ccamCode':
          // Modification du code CCAM
          await queryRunner.query(`INSERT INTO T_DENTAL_EVENT_TASK_DET (ETK_ID, DET_TYPE, DET_CCAM_CODE)
          VALUES (?, 'CCAM', ?)
          ON DUPLICATE KEY UPDATE
          DET_TYPE = VALUES(DET_TYPE),
          DET_CCAM_CODE = VALUES(DET_CCAM_CODE)`);
          break;

        case 'comp':
          // Modification du complément prestation
          oldComplement = await this.dataSource
            .createQueryBuilder()
            .select('T_DENTAL_EVENT_TASK_DET.DET_COMP')
            .from('T_DENTAL_EVENT_TASK_DET', 'T_DENTAL_EVENT_TASK_DET')
            .where(`T_DENTAL_EVENT_TASK_DET.ETK_ID = ${id}`)
            .getRawOne();

          await queryRunner.query(
            `INSERT INTO T_DENTAL_EVENT_TASK_DET (ETK_ID, DET_COMP)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE
          DET_COMP = VALUES(DET_COMP)`,
            [id, value ? value : null],
          );
          refreshAmount = true;
          break;

        case 'exceeding':
          // Modification du qualificatif de dépense
          await queryRunner.query(
            `INSERT INTO T_DENTAL_EVENT_TASK_DET (ETK_ID, DET_EXCEEDING)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE
          DET_EXCEEDING = VALUES(DET_EXCEEDING)`,
            [id, value ? value : null],
          );

          // Qualificatif de dépense Gratuit
          if (value === ExceedingEnum.GRATUIT) {
            await queryRunner.query(
              `UPDATE T_EVENT_TASK_ETK
            SET ETK_AMOUNT = 0
            WHERE ETK_ID = ?`,
              [id],
            );
          }
          break;

        case 'exceptional_refund':
          let exceeding = ExceedingEnum.NON_REMBOURSABLE;
          if (value) {
            const eventTasks = await queryRunner.query(
              `SELECT
              T_EVENT_TASK_ETK.USR_ID,
              T_EVENT_TASK_ETK.ETK_AMOUNT,
              T_DENTAL_EVENT_TASK_DET.DET_SECU_AMOUNT
            FROM T_EVENT_TASK_ETK
            JOIN T_DENTAL_EVENT_TASK_DET
            WHERE T_EVENT_TASK_ETK.ETK_ID = ?
              AND T_EVENT_TASK_ETK.ETK_ID = T_DENTAL_EVENT_TASK_DET.ETK_ID`,
              [id],
            );
            const eventTask = eventTasks[0];
            const user = await this.userRepository.findOneBy({
              id: eventTask['USR_ID'],
            });

            if (
              canPerformFreeFee(user) &&
              eventTask['ETK_AMOUNT'] > eventTask['DET_SECU_AMOUNT']
            ) {
              exceeding = ExceedingEnum.ENTENTE_DIRECTE;
            }
            {
              exceeding = null;
            }
          }
          await queryRunner.query(
            `UPDATE T_DENTAL_EVENT_TASK_DET SET exceptional_refund = ?, DET_EXCEEDING = ?, DET_CCAM_TELEM = ? WHERE ETK_ID = ?`,
            [value, exceeding, value, id],
          );
          break;

        case 'amount':
          const statements = await queryRunner.query(
            `SELECT
                    T_EVENT_TASK_ETK.ETK_DATE,
                    T_DENTAL_EVENT_TASK_DET.DET_EXCEEDING,
                    T_DENTAL_EVENT_TASK_DET.DET_CCAM_CODE,
                    T_USER_USR.USR_ID,
                    T_USER_PREFERENCE_USP.ccam_price_list
                FROM T_EVENT_TASK_ETK
                JOIN T_DENTAL_EVENT_TASK_DET
                JOIN T_USER_USR
                JOIN T_USER_PREFERENCE_USP
                WHERE T_EVENT_TASK_ETK.ETK_ID = ?
                  AND T_EVENT_TASK_ETK.ETK_ID = T_DENTAL_EVENT_TASK_DET.ETK_ID
                  AND T_EVENT_TASK_ETK.USR_ID = T_USER_USR.USR_ID
                  AND T_USER_USR.USR_ID = T_USER_PREFERENCE_USP.USR_ID`,
            [id],
          );
          const statement = statements[0];
          const date = new Date(statement['ETK_DATE']);
          const exceeding1 = statement['DET_EXCEEDING'];
          const code = statement['DET_CCAM_CODE'];
          const grid = statement['ccam_price_list'];

          const user = await this.userRepository.findOneBy({
            id: statement['USR_ID'],
          });
          if (
            canPerformFreeFee(user) &&
            exceeding1 !== ExceedingEnum.NON_REMBOURSABLE &&
            code
          ) {
            const ccamUnitPrice: { maximumPrice: number } =
              await this.ccamUnitPriceRepository
                .createQueryBuilder('cup')
                .select('cup.maximumPrice')
                .innerJoin('cup.ccam', 'cm')
                .where('cm.code = :code', { code })
                .andWhere('cup.grid = :grid', { grid })
                .andWhere('cup.createdOn <= :date', { date })
                .orderBy('cup.createdOn', 'DESC')
                .take(1)
                .getRawOne();

            const maximumPrice = ccamUnitPrice
              ? ccamUnitPrice.maximumPrice
              : null;
            if (maximumPrice && Number(value) > maximumPrice) {
              throw new Error(
                `L'acte ${code} ne peut être validé au tarif de ${value} euros car il dépasse le plafond de ${maximumPrice} euros.`,
              );
            }
          }

          // Modification du montant
          await queryRunner.query(
            ` UPDATE T_EVENT_TASK_ETK
          SET ETK_AMOUNT = ?
          WHERE ETK_ID = ?`,
            [parseFloat(value as string), id],
          );
          break;

        case 'caresheet':
          const status = value ? 2 : 1;
          // Acte facturé.
          // Important: impossible de modifier le status d'un acte mis sur feuille de soins.
          await queryRunner.query(
            `UPDATE T_EVENT_TASK_ETK
          JOIN T_DENTAL_EVENT_TASK_DET
          SET ETK_STATE = ?
          WHERE T_EVENT_TASK_ETK.ETK_ID = ?
            AND T_EVENT_TASK_ETK.ETK_ID = T_DENTAL_EVENT_TASK_DET.ETK_ID
            AND T_DENTAL_EVENT_TASK_DET.FSE_ID IS NULL`,
            [status, id],
          );
          break;
      }

      // Re-calcule du montant de l'acte en fonction
      // des modifications effectuées
      if (refreshAmount) {
        // Récupération de la nomenclature
        const nomenclatureStatement: { DET_TYPE: string } =
          await this.dataSource
            .createQueryBuilder()
            .select('T_DENTAL_EVENT_TASK_DET.DET_TYPE')
            .from('T_DENTAL_EVENT_TASK_DET', 'T_DENTAL_EVENT_TASK_DET')
            .where(`ETK_ID = ${id}`)
            .getRawOne();
        if (nomenclatureStatement.DET_TYPE === 'CCAM') {
          const statements: {
            amount: number;
            complement: EnumDentalEventTaskComp;
            ccamCode: string;
            ccamModifier: string;
          }[] = await queryRunner.query(
            `SELECT
                    T_EVENT_TASK_ETK.ETK_AMOUNT AS amount,
                    T_DENTAL_EVENT_TASK_DET.DET_COMP AS complement,
                    T_DENTAL_EVENT_TASK_DET.DET_CCAM_CODE AS ccamCode,
                    T_DENTAL_EVENT_TASK_DET.DET_CCAM_MODIFIER AS ccamModifier
                FROM T_EVENT_TASK_ETK
                JOIN T_DENTAL_EVENT_TASK_DET
                WHERE T_EVENT_TASK_ETK.ETK_ID = ?
                  AND T_EVENT_TASK_ETK.ETK_ID = T_DENTAL_EVENT_TASK_DET.ETK_ID`,
            [id],
          );
          let { amount, ccamModifier } = statements[0];
          const { complement, ccamCode } = statements[0];
          const ngapCcamComplement = {
            N: 'U',
            F: 'F',
          };

          // Retrait du montant de l'ancien complément
          if (
            oldComplement &&
            ngapCcamComplement.hasOwnProperty(oldComplement)
          ) {
            const ccamComplement = ngapCcamComplement[oldComplement];
            if (new RegExp(ccamComplement, 'i').test(ccamModifier)) {
              const ccamModifierStatement =
                await this.dentalModifierRepository.findOneBy({
                  code: ccamComplement,
                });
              const ccamModifierAmount = ccamModifierStatement.amount;
              if (ccamModifierAmount) {
                amount -= parseFloat(ccamModifierAmount.toString());
                ccamModifier = ccamModifier.replace(ccamComplement, '');

                await queryRunner.query(
                  `UPDATE T_EVENT_TASK_ETK
                SET ETK_AMOUNT = ?
                WHERE ETK_ID = ?`,
                  [amount, id],
                );

                await queryRunner.query(
                  `UPDATE T_DENTAL_EVENT_TASK_DET
                SET DET_CCAM_MODIFIER = ?
                WHERE ETK_ID = ?`,
                  [ccamModifier, id],
                );
              }
            }
          }

          // Ajout du montant du nouveau complément
          if (oldComplement && ngapCcamComplement.hasOwnProperty(complement)) {
            const ccamComplement = ngapCcamComplement[complement];
            if (new RegExp(ccamComplement, 'i').test(ccamModifier)) {
              // Vérification si le modificateur que l'on souhaite ajouter
              // existe dans la liste des modificateurs du code CCAM
              if (
                !containsModifier(ccamCode, ccamComplement, this.ccamRepository)
              ) {
                throw new Error(
                  `Complement prestation incompatible avec code de l'acte.`,
                );
              }
              const ccamModifierStatement =
                await this.dentalModifierRepository.findOneBy({
                  code: ccamComplement,
                });
              const ccamModifierAmount = ccamModifierStatement.amount;
              if (ccamModifierAmount) {
                amount += parseFloat(ccamModifierAmount.toString());
                ccamModifier.concat(ccamComplement);

                await queryRunner.query(
                  `UPDATE T_EVENT_TASK_ETK
                SET ETK_AMOUNT = ?
                WHERE ETK_ID = ?`,
                  [amount, id],
                );

                await queryRunner.query(
                  `UPDATE T_DENTAL_EVENT_TASK_DET
                SET DET_CCAM_MODIFIER = ?
                WHERE ETK_ID = ?`,
                  [ccamModifier, id],
                );
              }
            }
          }
        } else if (nomenclatureStatement.DET_TYPE === 'NGAP') {
          // Récupération des informations NGAP
          const statements: {
            coefficient: number;
            complement: EnumDentalEventTaskComp;
            socialSecurityAmount: number;
            complementNight: number;
            complementHoliday: number;
          }[] = await queryRunner.query(`
                SELECT
                    T_DENTAL_EVENT_TASK_DET.DET_COEF AS coefficient,
                    T_DENTAL_EVENT_TASK_DET.DET_COMP AS complement,
                    ngap_key.unit_price AS socialSecurityAmount,
                    ngap_key.complement_night AS complementNight,
                    ngap_key.complement_holiday AS complementHoliday
                FROM T_DENTAL_EVENT_TASK_DET
                JOIN ngap_key
                WHERE T_DENTAL_EVENT_TASK_DET.ETK_ID = ?
                  AND T_DENTAL_EVENT_TASK_DET.ngap_key_id = ngap_key.id`);
          if (statements.length > 0) {
            const {
              complementHoliday,
              coefficient,
              complement,
              socialSecurityAmount,
              complementNight,
            } = statements[0];

            // Calcul du nouveau montant
            let amount = socialSecurityAmount * coefficient;
            if (complement === 'N') {
              amount += complementNight;
            } else if (complement === 'F') {
              amount += complementHoliday;
            }

            await queryRunner.query(
              `
                    UPDATE T_EVENT_TASK_ETK
                    SET ETK_AMOUNT = ?
                    WHERE ETK_ID = ?`,
              [amount, id],
            );
          }
        }
      }

      /**
       * RÈGLES D’ASSOCIATION DES RADIOGRAPHIES EN MÉDECINE BUCCO-DENTAIRE.
       */
      const calculHonoraires = async (
        userId: number,
        patientId: number,
        date: string,
      ): Promise<string[]> => {
        console.log('radiographies', date);
        console.log(
          'radiographies',
          dayjs(date.toString()).format('YYYY-MM-DD'),
        );
        const radiographies: {
          id: number;
          name: string;
          coef: number;
          paragraphe: string;
        }[] = await queryRunner.query(
          `
              SELECT
                  T_EVENT_TASK_ETK.ETK_ID as id,
                  T_EVENT_TASK_ETK.ETK_NAME as name,
                  T_DENTAL_EVENT_TASK_DET.DET_COEF as coef,
                  ccam_menu.paragraphe
              FROM T_EVENT_TASK_ETK
              JOIN T_DENTAL_EVENT_TASK_DET
              JOIN ccam
              JOIN ccam_menu
              WHERE
                  T_EVENT_TASK_ETK.USR_ID = ? AND
                  T_EVENT_TASK_ETK.CON_ID = ? AND
                  T_EVENT_TASK_ETK.ETK_DATE = ? AND
                  T_EVENT_TASK_ETK.ETK_STATE = 1 AND
                  T_EVENT_TASK_ETK.ETK_ID = T_DENTAL_EVENT_TASK_DET.ETK_ID AND
                  (T_DENTAL_EVENT_TASK_DET.DET_EXCEEDING IS NULL OR T_DENTAL_EVENT_TASK_DET.DET_EXCEEDING != ?) AND
                  T_DENTAL_EVENT_TASK_DET.ccam_id = ccam.id AND
                  ccam.ccam_menu_id = ccam_menu.id AND
                  ccam_menu.paragraphe IN ('07.01.04.01', '11.01.03', '11.01.04')
              ORDER BY ETK_AMOUNT DESC`,
          [
            userId,
            patientId,
            dayjs(date).format('YYYY-MM-DD'),
            ExceedingEnum.NON_REMBOURSABLE,
          ],
        );
        console.log('radiographies', dayjs(date).format('YYYY-MM-DD'));

        const discountedCodes: string[] = [];
        if (radiographies.length > 0) {
          const reduceResult = radiographies.reduce((reduce, radiographie) => {
            return (
              reduce ||
              ['11.01.03', '11.01.04'].includes(radiographie.paragraphe)
            );
          }, false);
          if (reduceResult) {
            for (const [index, radiographie] of Object.entries(radiographies)) {
              if (!index) {
                await queryRunner.query(
                  `UPDATE T_DENTAL_EVENT_TASK_DET SET association_code = 1 WHERE ETK_ID = ${radiographie.id}`,
                );
                if (Number(radiographie.coef) === 0.5) {
                  await queryRunner.query(
                    `UPDATE T_DENTAL_EVENT_TASK_DET SET association_code = 1, DET_COEF = 1 WHERE ETK_ID = ${radiographie.id}`,
                  );
                  await queryRunner.query(
                    `UPDATE T_EVENT_TASK_ETK SET ETK_AMOUNT = ETK_AMOUNT * 2 WHERE ETK_ID = ${radiographie.id}`,
                  );
                }
              } else if (Number(radiographie.coef) === 1) {
                await queryRunner.query(
                  `UPDATE T_DENTAL_EVENT_TASK_DET SET association_code = 2, DET_COEF = 0.5 WHERE ETK_ID = ${radiographie.id}`,
                );
                await queryRunner.query(
                  `UPDATE T_EVENT_TASK_ETK SET ETK_AMOUNT = ETK_AMOUNT / 2 WHERE ETK_ID = ${radiographie.id}`,
                );
                discountedCodes.push(radiographie.name);
              }
            }
          } else {
            for (const [index, radiographie] of Object.entries(radiographies)) {
              if (Number(radiographie.coef) === 0.5) {
                await queryRunner.query(
                  `UPDATE T_DENTAL_EVENT_TASK_DET SET association_code = NULL, DET_COEF = 1 WHERE ETK_ID = ${radiographie.id}`,
                );
                await queryRunner.query(
                  `UPDATE T_EVENT_TASK_ETK SET ETK_AMOUNT = ETK_AMOUNT * 2 WHERE ETK_ID = ${radiographie.id}`,
                );
              }
            }
          }
        }
        return discountedCodes;
      };

      const act: EventTaskEntity = await this.eventTaskRepository.findOneBy({
        id: id,
      });
      console.log('EventTaskEntity', act);
      const discountedCodes: string[] = await calculHonoraires(
        act.id,
        act.conId,
        act.date,
      );
      console.log('discountedCodes', discountedCodes);
      const messages: string[] = [];
      for (const discountedCode in discountedCodes) {
        // @TODO translate
        //   $messages[] = $translator->trans('prestation.warning.associationRadiographie', [
        //     '%name%' => $discountedCode,
        // ]);
        messages.push(
          `L'acte ${discountedCode} va être facturé à 50% car il s'agit d'un acte de radiographie conventionnelle et doit être décoté par rapport à l'acte de radiographie le plus cher effectué lors de la séance.`,
        );
      }
      if (oldEventTask) {
        const discountedCodes2: string[] = await calculHonoraires(
          act.id,
          act.conId,
          oldEventTask.date,
        );
        for (const discountedCode in discountedCodes2) {
          // @TODO translate
          // $messages[] = $translator->trans('prestation.warning.associationRadiographie',
          //   '%name%' => $discountedCode,
          // ]);
          messages.push(
            `L'acte ${discountedCode} va être facturé à 50% car il s'agit d'un acte de radiographie conventionnelle et doit être décoté par rapport à l'acte de radiographie le plus cher effectué lors de la séance.`,
          );
        }
      }
      await queryRunner.commitTransaction();
      return { messages: messages ? messages : [] };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      return { message: e.message, code: 0 };
    } finally {
      await queryRunner.release();
    }
  }
}
