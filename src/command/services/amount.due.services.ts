import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ThirdPartyAmcEntity } from 'src/entities/third-party-amc.entity';
import { ThirdPartyAmoEntity } from 'src/entities/third-party-amo.entity';
import { ThirdPartyStatusEnum } from 'src/enum/third-party-status.enum';
import { DataSource, QueryRunner, Repository } from 'typeorm';

/**
 * application/Command/AmountDueCommand.php
 */
@Injectable()
export class AmountDueService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(ThirdPartyAmoEntity)
    private thirdPartyAmoRepository: Repository<ThirdPartyAmoEntity>,
    @InjectRepository(ThirdPartyAmcEntity)
    private thirdPartyAmcRepository: Repository<ThirdPartyAmcEntity>,
  ) {}

  /**
   * application/Command/AmountDueCommand.php line 43 -> 240
   * @param groupId
   */
  async execute(groupId: number) {
    try {
      /**
       * --------------------------------------------------------------------------
       * DROP TEMPORARY TABLE
       * --------------------------------------------------------------------------
       */

      await this.dataSource.query(
        'DROP TEMPORARY TABLE IF EXISTS temp_prestation',
      );
      await this.dataSource.query(
        'DROP TEMPORARY TABLE IF EXISTS temp_payment',
      );

      /**
       * --------------------------------------------------------------------------
       * CREATE TEMPORARY TABLE
       * --------------------------------------------------------------------------
       */

      await this.dataSource.query(`
      CREATE TEMPORARY TABLE temp_prestation (
        id INT AUTO_INCREMENT,
        patient_id INT,
        date DATE,
        amount DECIMAL(10,2),
        amount_care DECIMAL(10,2),
        amount_prosthesis DECIMAL(10,2),
        PRIMARY KEY (id),
        INDEX (patient_id)
      )`);

      /**
       * --------------------------------------------------------------------------
       * CREATE TEMPORARY TABLE
       * --------------------------------------------------------------------------
       */

      await this.dataSource.query(`
      CREATE TEMPORARY TABLE temp_payment (
        id INT AUTO_INCREMENT,
        patient_id INT,
        date DATE,
        amount DECIMAL(10,2),
        amount_care DECIMAL(10,2),
        amount_prosthesis DECIMAL(10,2),
        PRIMARY KEY (id),
        INDEX (patient_id)
      )`);

      // Récupération des utilisateurs
      const usrIds: { USR_ID: number }[] = await this.dataSource.query(
        `
        SELECT USR_ID
        FROM T_USER_USR
        WHERE 
          CASE WHEN ? IS NOT NULL
            THEN organization_id = ?
            ELSE 1 = 1
          END`,
        [groupId, groupId],
      );

      if (usrIds && usrIds.length > 0) {
        for (const item of usrIds) {
          // Récupération des actes
          await this.dataSource.query(
            `
            INSERT INTO temp_prestation (patient_id, date, amount, amount_care, amount_prosthesis)
            SELECT
              T_EVENT_TASK_ETK.CON_ID,
              T_EVENT_TASK_ETK.ETK_DATE,
              T_EVENT_TASK_ETK.ETK_AMOUNT,
              IF (F_ccam_prosthesis(T_EVENT_TASK_ETK.ccam_family) = 0, ETK_AMOUNT, 0),
              IF (F_ccam_prosthesis(T_EVENT_TASK_ETK.ccam_family) = 1, ETK_AMOUNT, 0)
            FROM T_EVENT_TASK_ETK
            JOIN T_CONTACT_CON
            LEFT OUTER JOIN T_EVENT_EVT ON T_EVENT_EVT.EVT_ID = T_EVENT_TASK_ETK.EVT_ID
            WHERE T_EVENT_TASK_ETK.ETK_STATE > 0
              AND T_EVENT_TASK_ETK.USR_ID = ?
              AND T_EVENT_TASK_ETK.deleted_at IS NULL
              AND T_EVENT_TASK_ETK.CON_ID = T_CONTACT_CON.CON_ID
              AND (
                T_EVENT_TASK_ETK.EVT_ID IS NULL OR
                T_EVENT_EVT.EVT_DELETE = 0
              )`,
            [item.USR_ID],
          );

          // Récupération des paiements
          await this.dataSource.query(
            `
            INSERT INTO temp_payment (patient_id, date, amount, amount_care, amount_prosthesis)
            SELECT
              T_CASHING_CONTACT_CSC.CON_ID,
              T_CASHING_CSG.CSG_PAYMENT_DATE,
              T_CASHING_CONTACT_CSC.CSC_AMOUNT,
              T_CASHING_CONTACT_CSC.amount_care,
              T_CASHING_CONTACT_CSC.amount_prosthesis
            FROM T_CASHING_CONTACT_CSC
            JOIN T_CONTACT_CON
            JOIN T_CASHING_CSG
            WHERE T_CASHING_CONTACT_CSC.CON_ID = T_CONTACT_CON.CON_ID
              AND T_CASHING_CONTACT_CSC.CSG_ID = T_CASHING_CSG.CSG_ID
              AND T_CASHING_CSG.USR_ID = ?
              AND T_CASHING_CSG.deleted_at IS NULL`,
            [item.USR_ID],
          );

          /**
           * --------------------------------------------------------------------------
           * START TRANSACTION
           * --------------------------------------------------------------------------
           */
          const queryRunner = this.dataSource.createQueryRunner();
          // await queryRunner.connect();
          await queryRunner.startTransaction();
          try {
            await queryRunner.query(
              `
                UPDATE contact_user_cou
                SET cou_amount_due = 0,
                    amount_due_care = 0,
                    amount_due_prosthesis = 0,
                    third_party_balance = 0
                WHERE usr_id = ?
            `,
              [item.USR_ID],
            );

            await queryRunner.query(
              `
              INSERT INTO contact_user_cou (con_id, usr_id, cou_amount_due, amount_due_care, amount_due_prosthesis, cou_last_care, cou_last_payment)
              SELECT
                  t1.patient_id,
                  ?,
                  SUM(t1.amount),
                  SUM(t1.amount_care),
                  SUM(t1.amount_prosthesis),
                  MAX(t1.max_date_1),
                  MAX(t1.max_date_2)
              FROM (
                  SELECT
                      patient_id,
                      SUM(amount) AS amount,
                      SUM(amount_care) AS amount_care,
                      SUM(amount_prosthesis) AS amount_prosthesis,
                      MAX(date) AS max_date_1,
                      NULL AS max_date_2
                  FROM temp_prestation
                  GROUP BY patient_id
                  UNION
                  SELECT
                      patient_id,
                      SUM(-amount) AS amount,
                      SUM(-amount_care) AS amount_care,
                      SUM(-amount_prosthesis) AS amount_prosthesis,
                      NULL AS max_date_1,
                      MAX(date) AS max_date_2
                  FROM temp_payment
                  GROUP BY patient_id
              ) AS t1
              GROUP BY t1.patient_id
              ON DUPLICATE KEY UPDATE cou_amount_due = VALUES(cou_amount_due),
                                      amount_due_care = VALUES(amount_due_care),
                                      amount_due_prosthesis = VALUES(amount_due_prosthesis),
                                      cou_last_care = VALUES(cou_last_care),
                                      cou_last_payment = VALUES(cou_last_payment)
            `,
              [item.USR_ID],
            );

            await this.computeThirdPartyAmo(item.USR_ID, queryRunner);
            await this.computeThirdPartyAmc(item.USR_ID, queryRunner);

            /**
             * --------------------------------------------------------------------------
             * COMMIT
             * --------------------------------------------------------------------------
             */

            await queryRunner.commitTransaction();

            /**
             * --------------------------------------------------------------------------
             * TRUNCATE TEMPORARY TABLE
             * --------------------------------------------------------------------------
             */

            await queryRunner.query('TRUNCATE TABLE temp_prestation');
            await queryRunner.query('TRUNCATE TABLE temp_payment');
          } catch (err) {
            await queryRunner.rollbackTransaction();
          } finally {
            await queryRunner.release();
          }
        }
      }

      /**
       * --------------------------------------------------------------------------
       * DROP TEMPORARY TABLE
       * --------------------------------------------------------------------------
       */

      await this.dataSource.query(
        'DROP TEMPORARY TABLE IF EXISTS temp_prestation',
      );
      await this.dataSource.query(
        'DROP TEMPORARY TABLE IF EXISTS temp_payment',
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calcul le montant dû relatif aux tiers payants AMO des patients.
   *
   * @param int userId identifiant de l'utilisateur
   */
  async computeThirdPartyAmo(userId: number, queryRunner: QueryRunner) {
    try {
      const results: {
        patientId: number;
        amountRemaining: number;
        amountCareRemaining: number;
        amountProsthesisRemaining: number;
      }[] = await this.thirdPartyAmoRepository
        .createQueryBuilder('thirdPartyAmo')
        .select('thirdPartyAmo.patientId', 'patientId')
        .addSelect(
          'SUM(thirdPartyAmo.amount) - SUM(thirdPartyAmo.amountPaid)',
          'amountRemaining',
        )
        .addSelect(
          'SUM(thirdPartyAmo.amountCare) - SUM(thirdPartyAmo.amountCarePaid)',
          'amountCareRemaining',
        )
        .addSelect(
          'SUM(thirdPartyAmo.amountProsthesis) - SUM(thirdPartyAmo.amountProsthesisPaid)',
          'amountProsthesisRemaining',
        )
        .where('thirdPartyAmo.userId = :user', { user: userId })
        .andWhere('thirdPartyAmo.status != :status', {
          status: ThirdPartyStatusEnum.REJECTED,
        })
        .groupBy('thirdPartyAmo.patientId')
        .getRawMany();

      for (const row of results) {
        const patientId = row.patientId;
        const amountRemaining = row.amountRemaining;
        const amountCareRemaining = row.amountCareRemaining;
        const amountProsthesisRemaining = row.amountProsthesisRemaining;

        queryRunner.query(
          `UPDATE contact_user_cou
            SET cou_amount_due = cou_amount_due - ?,
            amount_due_care = amount_due_care - ? ,
            amount_due_prosthesis = amount_due_prosthesis - ?,
            third_party_balance = third_party_balance + ?
            WHERE con_id = ? AND usr_id = ?
            `,
          [
            amountRemaining,
            amountCareRemaining,
            amountProsthesisRemaining,
            amountRemaining,
            patientId,
            userId,
          ],
        );
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calcul le montant dû relatif aux tiers payants AMC des patients.
   *
   * @param int $userId identifiant de l'utilisateur
   */
  async computeThirdPartyAmc(userId: number, queryRunner: QueryRunner) {
    try {
      const results: {
        patientId: number;
        amountRemaining: number;
        amountCareRemaining: number;
        amountProsthesisRemaining: number;
      }[] = await this.thirdPartyAmcRepository
        .createQueryBuilder('thirdPartyAmc')
        .select('thirdPartyAmc.patientId', 'patientId')
        .addSelect(
          'SUM(thirdPartyAmc.amount) - SUM(thirdPartyAmc.amountPaid)',
          'amountRemaining',
        )
        .addSelect(
          'SUM(thirdPartyAmc.amountCare) - SUM(thirdPartyAmc.amountCarePaid)',
          'amountCareRemaining',
        )
        .addSelect(
          'SUM(thirdPartyAmc.amountProsthesis) - SUM(thirdPartyAmc.amountProsthesisPaid)',
          'amountProsthesisRemaining',
        )
        .where('thirdPartyAmc.userId = :user', { user: userId })
        .andWhere('thirdPartyAmc.status != :status', {
          status: ThirdPartyStatusEnum.REJECTED,
        })
        .groupBy('thirdPartyAmc.patientId')
        .getRawMany();

      for (const row of results) {
        const patientId = row.patientId;
        const amountRemaining = row.amountRemaining;
        const amountCareRemaining = row.amountCareRemaining;
        const amountProsthesisRemaining = row.amountProsthesisRemaining;
        queryRunner.query(
          `UPDATE contact_user_cou
         SET cou_amount_due = cou_amount_due - ?,
         amount_due_care = amount_due_care - ? ,
         amount_due_prosthesis = amount_due_prosthesis - ?,
         third_party_balance = third_party_balance + ?
         WHERE con_id = ? AND usr_id = ?
         `,
          [
            amountRemaining,
            amountCareRemaining,
            amountProsthesisRemaining,
            amountRemaining,
            patientId,
            userId,
          ],
        );
      }
    } catch (error) {
      throw error;
    }
  }
}
