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
import { CcamUnitPriceEntity } from 'src/entities/ccamunitprice.entity';
import { EnumDentalEventTaskComp } from 'src/entities/dental-event-task.entity';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(EventTaskEntity)
    private eventTaskRepository: Repository<EventTaskEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(CcamUnitPriceEntity)
    private ccamUnitPriceRepository: Repository<CcamUnitPriceEntity>,
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

  async updateTaskPatch(
    groupId: number,
    { name, pk, value }: EventTaskPatchDto,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let oldDate: EventTaskEntity = null;
    const id: number = pk;
    let oldComplement: EnumDentalEventTaskComp = null;
    let refreshAmount = false;
    const canPerformFreeFee = (user: UserEntity): boolean => {
      if (user.droitPermanentDepassement === 1) {
        return true;
      }
      if (user.amo) {
        return user.amo.codeConvention === 0;
      }
      return false;
    };
    async function getMaximumPriceByCodeAndGridAndDate(
      code: string,
      grid: number,
      date: Date,
    ): Promise<number | null> {
      const result = await this.ccamUnitPriceRepository
        .createQueryBuilder('cup')
        .select('cup.maximumPrice')
        .innerJoin('cup.ccam', 'cm')
        .where('cm.code = :code', { code })
        .andWhere('cup.grid = :grid', { grid })
        .andWhere('cup.createdOn <= :date', { date })
        .orderBy('cup.createdOn', 'DESC')
        .take(1)
        .getRawOne();

      return result ? result.maximumPrice : null;
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
          oldDate = await this.dataSource
            .createQueryBuilder()
            .select('T_EVENT_TASK_ETK.ETK_DATE')
            .from('T_EVENT_TASK_ETK', 'T_EVENT_TASK_ETK')
            .where(`T_EVENT_TASK_ETK.ETK_ID = ${id}`)
            .getRawOne();

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
            const maximumPrice = await getMaximumPriceByCodeAndGridAndDate(
              code,
              grid,
              date,
            );
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
        const nomenclatureStatement = await this.dataSource
          .createQueryBuilder()
          .select('T_DENTAL_EVENT_TASK_DET.DET_TYPE')
          .from('T_DENTAL_EVENT_TASK_DET', 'T_DENTAL_EVENT_TASK_DET')
          .where(`ETK_ID = ${id}`)
          .getRawOne();
        if (nomenclatureStatement['DET_TYPE'] === 'CCAM') {
          const statements = await queryRunner.query(
            `SELECT
                    T_EVENT_TASK_ETK.ETK_AMOUNT AS amount,
                    T_DENTAL_EVENT_TASK_DET.DET_COMP AS complement,
                    T_DENTAL_EVENT_TASK_DET.DET_CCAM_CODE AS ccam_code,
                    T_DENTAL_EVENT_TASK_DET.DET_CCAM_MODIFIER AS ccam_modifier
                FROM T_EVENT_TASK_ETK
                JOIN T_DENTAL_EVENT_TASK_DET
                WHERE T_EVENT_TASK_ETK.ETK_ID = ?
                  AND T_EVENT_TASK_ETK.ETK_ID = T_DENTAL_EVENT_TASK_DET.ETK_ID`,
            [id],
          );
          const statement = statements[0];
          const amount = statement['amount'];
          const complement = statement['complement'];
          const ccamCode = statement['ccam_code'];
          const ccamModifier = statement['ccam_modifier'];
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
            }
          }
        }
      }
    } catch (e) {
      await queryRunner.rollbackTransaction();
      return { message: e.message, code: 0 };
    } finally {
      await queryRunner.release();
    }
  }
}
