import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { EventTaskDto, EventTaskPatchDto } from '../dto/task.contact.dto';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { ErrorCode } from 'src/constants/error';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { EnumDentalEventTaskComp } from 'src/entities/dental-event-task.entity';
import { DentalModifierEntity } from 'src/entities/dental-modifier.entity';
import { CcamEntity } from 'src/entities/ccam.entity';
import { DataSource } from 'typeorm';
import { ExceedingEnum } from 'src/constants/act';
import { UserEntity } from 'src/entities/user.entity';
import { CcamUnitPriceEntity } from 'src/entities/ccamunitprice.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { checkNumber } from 'src/common/util/number';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(EventTaskEntity)
    private eventTaskRepository: Repository<EventTaskEntity>,
    @InjectRepository(UserPreferenceEntity)
    private userPreferenceRepo: Repository<UserPreferenceEntity>,
    @InjectRepository(DentalModifierEntity)
    private dentalModifierRepository: Repository<DentalModifierEntity>,
    @InjectRepository(CcamEntity)
    private ccamRepository: Repository<CcamEntity>,
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
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
    await this.eventTaskRepository.update(payload.id, { status: 0 });
  }

  /**
   * php/event/task/realized.php line 15->76
   * @param payload
   * @param identity
   */
  async realizeEventTask(payload: EventTaskDto, identity: UserIdentity) {
    try {
      // Récupération du fuseau horaire
      const userPreference: UserPreferenceEntity =
        await this.userPreferenceRepo.findOne({
          select: {
            timezone: true,
          },
          where: {
            usrId: payload.user,
          },
        });

      dayjs.extend(utc);
      dayjs.extend(timezone);
      const datetime: string = dayjs()
        .tz(userPreference.timezone)
        .format('YYYY-MM-DD');

      // Récupération de l'identifiant du patient
      const eventTask: EventTaskEntity = await this.eventTaskRepository
        .createQueryBuilder('event')
        .select('event.conId')
        .innerJoin('event.patient', 'patient')
        .where('event.id = :id', { id: payload.id })
        .andWhere('event.conId = patient.id')
        .andWhere('patient.organizationId = :orgId', { orgId: identity.org })
        .getOne();

      if (!eventTask) {
        throw new CNotFoundRequestException(ErrorCode.NOT_FOUND_PATIENT);
      }

      // Modification des informations de l'acte
      await this.eventTaskRepository.update(payload.id, {
        status: 1,
        date: datetime,
      });

      // Traçabilité IDS
      // @TODO Ids\Log::write('Acte', $patientId, 2);
    } catch (error) {
      throw new CNotFoundRequestException(ErrorCode.CANNOT_UPDATE_EVENT);
    }
  }

  async updateEventTaskPatch(payload: EventTaskPatchDto) {
    try {
      {
        let refreshAmount = false;
        if (!payload.name) {
          throw new CNotFoundRequestException(ErrorCode.STATUS_NOT_FOUND);
        } else {
          let oldEventTask: EventTaskEntity = null;
          let oldComplement: EnumDentalEventTaskComp = null;
          if (payload?.name) {
            if (payload?.name === 'name') {
              await this.eventTaskRepository.update(payload.pk, {
                name: payload.value,
              });
            }
            if (payload?.name === 'msg') {
              await this.eventTaskRepository.update(payload.pk, {
                msg: payload.value,
              });
            }
            if (payload?.name === 'date') {
              // Modification du complément prestation
              oldEventTask = await this.eventTaskRepository.findOneBy({
                id: payload.pk,
              });

              await this.eventTaskRepository.update(payload.pk, {
                date: payload.value,
              });
            }
            if (payload?.name === 'teeth') {
              const installTeeth = `INSERT INTO T_DENTAL_EVENT_TASK_DET (ETK_ID, DET_TOOTH) VALUES (?, ?) ON DUPLICATE KEY UPDATE DET_TOOTH = VALUES(DET_TOOTH)`;
              await this.dataSource.manager.query(installTeeth, [
                payload.pk,
                payload.value,
              ]);
            }
            let ngapKeyId;
            let coefficient;
            if (payload?.name === 'cotationNgap' && (payload.value as object)) {
              if (payload?.value && typeof payload.value === 'object') {
                ngapKeyId = payload.value?.ngap_key_id;
                coefficient = payload.value?.coef;
                const installCotationNgap = `INSERT INTO T_DENTAL_EVENT_TASK_DET (ETK_ID, ngap_key_id, DET_COEF)
               VALUES (?, ?, ?)
               ON DUPLICATE KEY UPDATE
               ngap_key_id = VALUES(ngap_key_id),
               DET_COEF = VALUES(DET_COEF)`;
                await this.dataSource.manager.query(installCotationNgap, [
                  payload.pk,
                  ngapKeyId,
                  coefficient,
                ]);
                refreshAmount = true;
              }
            }
            if (payload?.name === 'code' || payload?.name === 'ccamCode') {
              const installCode = `INSERT INTO T_DENTAL_EVENT_TASK_DET (ETK_ID, DET_TYPE, DET_CCAM_CODE)
              VALUES (?, 'CCAM', ?)
              ON DUPLICATE KEY UPDATE
              DET_TYPE = VALUES(DET_TYPE),
              DET_CCAM_CODE = VALUES(DET_CCAM_CODE)`;
              await this.dataSource.manager.query(installCode, [
                payload.pk,
                payload?.value,
              ]);
            }
            if (payload?.name === 'comp') {
              oldComplement = await this.dataSource
                .createQueryBuilder()
                .select('T_DENTAL_EVENT_TASK_DET.DET_COMP')
                .from('T_DENTAL_EVENT_TASK_DET', 'T_DENTAL_EVENT_TASK_DET')
                .where(`T_DENTAL_EVENT_TASK_DET.ETK_ID = :pk`, {
                  pk: payload.pk,
                })
                .getRawOne();

              const installComp = `INSERT INTO T_DENTAL_EVENT_TASK_DET (ETK_ID, DET_COMP)
              VALUES (?, ?)
              ON DUPLICATE KEY UPDATE
              DET_COMP = VALUES(DET_COMP)`;
              await this.dataSource.manager.query(installComp, [
                payload.pk,
                payload?.value || null,
              ]);
            }
            if (payload?.name === 'exceeding') {
              const installExceeding = `INSERT INTO T_DENTAL_EVENT_TASK_DET (ETK_ID, DET_EXCEEDING)
              VALUES (?, ?)
              ON DUPLICATE KEY UPDATE
              DET_EXCEEDING = VALUES(DET_EXCEEDING)`;
              await this.dataSource.manager.query(installExceeding, [
                payload.pk,
                payload?.value || null,
              ]);
              if (payload.value === ExceedingEnum.GRATUIT) {
                const updateAMOUNT = ` 
                UPDATE T_EVENT_TASK_ETK
                SET ETK_AMOUNT = 0
                WHERE ETK_ID = ?`;
                await this.dataSource.manager.query(updateAMOUNT, [payload.pk]);
              }
            }
            if (payload.name === 'amount') {
              const event = await this.dataSource.manager.query(
                `
                    SELECT
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
                      AND T_USER_USR.USR_ID = T_USER_PREFERENCE_USP.USR_ID
                `,
                [checkNumber(payload.pk) || 0],
              );

              const date = dayjs(event[0].ETK_DATE).format('YYYY-MM-DD');
              const exceeding = event[0].DET_EXCEEDING;
              const code = event[0].DET_CCAM_CODE;
              const grid = event[0].ccam_price_list;

              const user: UserEntity = await this.userRepo.findOne({
                relations: {
                  amo: true,
                },
                where: {
                  id: event[0].USR_ID,
                },
              });

              if (
                !(
                  user.droitPermanentDepassement ||
                  user.amo.codeConvention === 0 ||
                  false
                ) &&
                exceeding !== ExceedingEnum.NON_REMBOURSABLE &&
                code
              ) {
                const ccamUnitPrice: CcamUnitPriceEntity = await this.dataSource
                  .createQueryBuilder(CcamUnitPriceEntity, 'cup')
                  .select('cup.maximumPrice')
                  .innerJoin('cup.ccam', 'cm')
                  .andWhere('cm.code = :code', { code })
                  .andWhere('cup.grid = :grid', { grid })
                  .andWhere('cup.createdOn <= :date', { date })
                  .orderBy('cup.createdOn', 'DESC')
                  .getOne();

                if (
                  ccamUnitPrice &&
                  ccamUnitPrice.maximumPrice &&
                  Number(payload.value) > ccamUnitPrice.maximumPrice
                ) {
                  // @TODO const messages = `Le montant des honoraires facturés ne respecte pas la convention. Il vous appartient d'en informer votre patient (le plafond est de ${ccamUnitPrice.maximumPrice}€).`;
                }
              }

              // Modification du montant
              await this.dataSource.manager.query(
                `
                UPDATE T_EVENT_TASK_ETK
                SET ETK_AMOUNT = ?
                WHERE ETK_ID = ?
              `,
                [Number(payload.value), payload.pk],
              );
            }
            if (payload?.name === 'caresheet') {
              const state = payload.value ? 2 : 1;
              const installCaresheet = `
              UPDATE T_EVENT_TASK_ETK
                    JOIN T_DENTAL_EVENT_TASK_DET
                    SET ETK_STATE = ?
                    WHERE T_EVENT_TASK_ETK.ETK_ID = ?
                      AND T_EVENT_TASK_ETK.ETK_ID = T_DENTAL_EVENT_TASK_DET.ETK_ID
                      AND T_DENTAL_EVENT_TASK_DET.FSE_ID IS NULL`;
              await this.dataSource.manager.query(installCaresheet, [
                state,
                payload?.pk,
              ]);
            }
          }

          const queryRunner = this.dataSource.createQueryRunner();
          await queryRunner.connect();
          await queryRunner.startTransaction();
          async function containsModifier(
            code: string,
            modifier: string,
            ccamRepository: Repository<CcamEntity>,
          ): Promise<boolean> {
            const queryBuilder = ccamRepository.createQueryBuilder('ccam');
            queryBuilder.select('COUNT(ccam.id)', 'count');
            queryBuilder.where('ccam.code = :code', { code });
            queryBuilder.andWhere('ccam.modifiers LIKE :modifiers', {
              modifiers: `%${modifier
                .replace(/%/g, '\\%')
                .replace(/_/g, '\\_')}%`,
            });

            const result = await queryBuilder.getRawOne();
            const count = Number(result.count);
            return Boolean(count);
          }
          try {
            const { pk } = payload;
            const id: number = pk;
            // Re-calcule du montant de l'acte en fonction
            // des modifications effectuées
            if (refreshAmount) {
              // Récupération de la nomenclature
              const nomenclatureStatement: { DET_TYPE: string } =
                await this.dataSource
                  .createQueryBuilder()
                  .select('T_DENTAL_EVENT_TASK_DET.DET_TYPE')
                  .from('T_DENTAL_EVENT_TASK_DET', 'T_DENTAL_EVENT_TASK_DET')
                  .where(`ETK_ID = :id`, { id })
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

                      await Promise.all([
                        queryRunner.query(
                          `UPDATE T_EVENT_TASK_ETK
                        SET ETK_AMOUNT = ?
                        WHERE ETK_ID = ?`,
                          [amount, id],
                        ),
                        queryRunner.query(
                          `UPDATE T_DENTAL_EVENT_TASK_DET
                        SET DET_CCAM_MODIFIER = ?
                        WHERE ETK_ID = ?`,
                          [ccamModifier, id],
                        ),
                      ]);
                    }
                  }
                }

                // Ajout du montant du nouveau complément
                if (
                  oldComplement &&
                  ngapCcamComplement.hasOwnProperty(complement)
                ) {
                  const ccamComplement = ngapCcamComplement[complement];
                  if (new RegExp(ccamComplement, 'i').test(ccamModifier)) {
                    // Vérification si le modificateur que l'on souhaite ajouter
                    // existe dans la liste des modificateurs du code CCAM
                    if (
                      !containsModifier(
                        ccamCode,
                        ccamComplement,
                        this.ccamRepository,
                      )
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

                      await Promise.all([
                        queryRunner.query(
                          `UPDATE T_EVENT_TASK_ETK
                        SET ETK_AMOUNT = ?
                        WHERE ETK_ID = ?`,
                          [amount, id],
                        ),
                        queryRunner.query(
                          `UPDATE T_DENTAL_EVENT_TASK_DET
                        SET DET_CCAM_MODIFIER = ?
                        WHERE ETK_ID = ?`,
                          [ccamModifier, id],
                        ),
                      ]);
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
                }[] = await queryRunner.query(
                  `
                      SELECT
                          T_DENTAL_EVENT_TASK_DET.DET_COEF AS coefficient,
                          T_DENTAL_EVENT_TASK_DET.DET_COMP AS complement,
                          ngap_key.unit_price AS socialSecurityAmount,
                          ngap_key.complement_night AS complementNight,
                          ngap_key.complement_holiday AS complementHoliday
                      FROM T_DENTAL_EVENT_TASK_DET
                      JOIN ngap_key
                      WHERE T_DENTAL_EVENT_TASK_DET.ETK_ID = ?
                        AND T_DENTAL_EVENT_TASK_DET.ngap_key_id = ngap_key.id`,
                  [payload.pk],
                );
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

              const discountedCodes: string[] = [];
              if (radiographies.length > 0) {
                const reduceResult = radiographies.reduce(
                  (reduce, radiographie) => {
                    return (
                      reduce ||
                      ['11.01.03', '11.01.04'].includes(radiographie.paragraphe)
                    );
                  },
                  false,
                );
                if (reduceResult) {
                  Promise.all(
                    radiographies.map(async (radiographie, index) => {
                      if (!index) {
                        await queryRunner.query(
                          `UPDATE T_DENTAL_EVENT_TASK_DET SET association_code = 1 WHERE ETK_ID = ?`,
                          [radiographie.id],
                        );
                        if (Number(radiographie.coef) === 0.5) {
                          await Promise.all([
                            queryRunner.query(
                              `UPDATE T_DENTAL_EVENT_TASK_DET SET association_code = 1, DET_COEF = 1 WHERE ETK_ID = ?`,
                              [radiographie.id],
                            ),
                            queryRunner.query(
                              `UPDATE T_EVENT_TASK_ETK SET ETK_AMOUNT = ETK_AMOUNT * 2 WHERE ETK_ID = ?`,
                              [radiographie.id],
                            ),
                          ]);
                        }
                      } else if (Number(radiographie.coef) === 1) {
                        await Promise.all([
                          queryRunner.query(
                            `UPDATE T_DENTAL_EVENT_TASK_DET SET association_code = 2, DET_COEF = 0.5 WHERE ETK_ID = ?`,
                            [radiographie.id],
                          ),
                          queryRunner.query(
                            `UPDATE T_EVENT_TASK_ETK SET ETK_AMOUNT = ETK_AMOUNT / 2 WHERE ETK_ID = ?`,
                            [radiographie.id],
                          ),
                        ]);
                        discountedCodes.push(radiographie.name);
                      }
                    }),
                  );
                } else {
                  Promise.all(
                    radiographies.map(async (radiographie) => {
                      if (Number(radiographie.coef) === 0.5) {
                        await Promise.all([
                          queryRunner.query(
                            `UPDATE T_DENTAL_EVENT_TASK_DET SET association_code = NULL, DET_COEF = 1 WHERE ETK_ID = ?`,
                            [radiographie.id],
                          ),
                          queryRunner.query(
                            `UPDATE T_EVENT_TASK_ETK SET ETK_AMOUNT = ETK_AMOUNT * 2 WHERE ETK_ID = ?`,
                            [radiographie.id],
                          ),
                        ]);
                      }
                    }),
                  );
                }
              }
              return discountedCodes;
            };

            const act: EventTaskEntity =
              await this.eventTaskRepository.findOneBy({
                id: id,
              });
            const discountedCodes: string[] = await calculHonoraires(
              act.id,
              act.conId,
              act.date,
            );
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
    } catch (error) {
      throw new CBadRequestException(ErrorCode.CANNOT_UPDATE_EVENT);
    }
  }
}
