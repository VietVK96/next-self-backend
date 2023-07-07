import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import {
  ContactPaymentFindAllDto,
  ContactPaymentStoreDto,
  ContactPaymentUpdateDto,
  IBeneficiary,
  IDeadline,
} from '../dto/contact.payment.dto';
import {
  CashingEntity,
  EnumCashingPayment,
  EnumCashingType,
} from 'src/entities/cashing.entity';
import { CashingContactEntity } from 'src/entities/cashing-contact.entity';
import { UserEntity } from 'src/entities/user.entity';
import { ContactEntity } from 'src/entities/contact.entity';
import { SlipCheckEntity } from 'src/entities/slip-check.entity';
import {
  ContactPaymentFindAllRes,
  ContactPaymentUpdateRes,
} from '../response/contact.payment.res';
import { InjectRepository } from '@nestjs/typeorm';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { PermissionService } from 'src/user/services/permission.service';
import { CorrespondentEntity } from 'src/entities/correspondent.entity';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { FseEntity } from 'src/entities/fse.entity';
import { ErrorCode } from 'src/constants/error';

@Injectable()
export class ContactPaymentService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(CashingEntity)
    private readonly repo: Repository<CashingEntity>,
    @InjectRepository(CashingContactEntity)
    private readonly cashingContactRepo: Repository<CashingContactEntity>,
    private permissionService: PermissionService,
  ) {}

  /**
   * File: php\contact\payment\findAll.php 13->62
   */
  async findAll(
    request?: ContactPaymentFindAllDto,
  ): Promise<ContactPaymentFindAllRes[]> {
    const select = `
      csg.CSG_ID AS id,
      csg.CSG_PAYMENT AS payment,
      csg.CSG_PAYMENT_DATE AS paymentDate,
      csg.CSG_TYPE AS TYPE,
      csg.is_tp,
      csc.amount_care,
      csc.amount_prosthesis,
      csc.CSC_AMOUNT as amount,
      csg.CSG_MSG as msg,
      IF (con.CON_ID IS NOT NULL, CONCAT_WS(' ', con.CON_LASTNAME, con.CON_FIRSTNAME), csg.CSG_DEBTOR) as debtor,
      usr.USR_ID AS practitionerId,
      usr.USR_ABBR AS practitionerAbbr,
      usr.USR_LASTNAME AS practitionerLastname,
      usr.USR_FIRSTNAME AS practitionerFirstname,
      slc.SLC_ID AS bordereau_id,
      slc.SLC_NBR AS bordereau_number`;
    const cashes = await this.dataSource
      .createQueryBuilder()
      .select(select)
      .from(CashingEntity, 'csg')
      .innerJoin(CashingContactEntity, 'csc')
      .innerJoin(UserEntity, 'usr')
      .leftJoin(ContactEntity, 'con', 'con.CON_ID = csg.CON_ID')
      .leftJoin(SlipCheckEntity, 'slc', 'slc.SLC_ID = csg.SLC_ID')
      .where('csg.CSG_ID = csc.CSG_ID')
      .andWhere('csc.CON_ID = :id', { id: request?.id })
      .andWhere('csg.USR_ID = usr.USR_ID')
      .getRawMany();
    for (const cash of cashes) {
      cash.bordereau = null;
      if (cash.bordereau_id) {
        cash.bordereau = {
          id: cash.bordereau_id,
          number: cash.bordereau_number,
        };
      }
      delete cash.bordereau_id;
      delete cash.bordereau_number;
    }
    return cashes;
  }

  /**
   * php/payment/delete.php
   * 21->53
   */
  async deleteById(id: number, identity: UserIdentity) {
    try {
      const payment = await this.repo.findOne({
        where: {
          id,
        },
        relations: {
          payees: true,
        },
      });
      // check permission
      if (payment) {
        if (
          !this.permissionService.hasPermission(
            'PERMISSION_PAIEMENT',
            8,
            identity.id,
            payment.usrId,
          ) ||
          !this.permissionService.hasPermission(
            'PERMISSION_DELETE',
            8,
            identity.id,
          )
        ) {
          throw new CBadRequestException(ErrorCode.PERMISSION_DENIED);
        }

        // TODO Create Log
        //  payees = payment->getPayees();
        //   foreach (payees as payee) {
        //     Ids\Log::write('Paiement', payee->getPatient()->getId(), 3);
        // }
        if (payment.payees) {
          const payeesId = payment.payees.map((e) => e.id);
          this.cashingContactRepo.delete(payeesId);
        }
        await this.repo.delete({ id });
        return;
      }
    } catch (error) {
      throw new CBadRequestException(error);
    }
  }
  // application/Services/Payment.php
  // 62 -> 377
  async store(payload: ContactPaymentStoreDto) {
    // Remboursement : montant en négatif.
    const data = this.refundAmount(payload);

    const date = data?.date || null;
    const paymentDate = data?.payment_date || null;
    const payment = data?.payment || 'cheque';
    const type = data?.type || 'honoraire';
    const checkNumber = data?.check_number || null;
    const checkBank = data?.check_bank || null;
    const description = data?.description || null;
    const amount = data?.amount || 0;
    const amountCare = data?.amount_care || 0;
    const amountProsthesis = data?.amount_prosthesis || 0;
    const practitionerId = data?.practitioner?.id || null;
    const correspondentId = data?.correspondent?.id || null;
    const bankId = data?.bank?.id || null;
    const caresheetId = data?.caresheet?.id || null;
    const debtorId = data?.debtor?.id || null;
    const debtorName = data?.debtor?.name || null;

    // Champ practitioner.id requis
    if (!practitionerId) {
      throw new CBadRequestException('Invalid practitioner');
    }

    // Montant soins OU prothèses requis
    if (!amountCare && !amountProsthesis) {
      throw new CBadRequestException(
        'Invalid amount care and amount prosthesis',
      );
    }

    // Bénéficiaires du règlement, uniquement ceux ayant un montant.
    let beneficiaries: IBeneficiary[];
    if (data.beneficiaries && Array.isArray(data.beneficiaries)) {
      beneficiaries = data.beneficiaries.filter((e) => e.pivot.amount);
      beneficiaries.forEach((e) => {
        e.amount_care = 0;
        e.amount_prosthesis = 0;
      });
    }

    let deadlines: IDeadline[];
    if (data.deadlines && Array.isArray(data.deadlines)) {
      deadlines = data.deadlines.filter((e) => e.amount);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const insertToCSG = `INSERT INTO T_CASHING_CSG (
        USR_ID,
        CON_ID,
        LBK_ID,
        FSE_ID,
        correspondent_id,
        CSG_DEBTOR,
        CSG_DATE,
        CSG_MSG,
        CSG_PAYMENT,
        CSG_PAYMENT_DATE,
        CSG_CHECK_NBR,
        CSG_CHECK_BANK,
        CSG_TYPE,
        CSG_AMOUNT,
        amount_care,
        amount_prosthesis
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

      const insertToCSC = `
          INSERT INTO T_CASHING_CONTACT_CSC (CSG_ID, CON_ID, CSC_AMOUNT, amount_care, amount_prosthesis)
					VALUES (?, ?, ?, ?, ?)`;
      const updateToCOU = `
          UPDATE contact_user_cou
          SET cou_unpaid_level = 0
          WHERE con_id = ?
          AND usr_id = ?
        `;

      if (deadlines.length < 2) {
        const insertRes = await queryRunner.query(insertToCSG, [
          practitionerId,
          debtorId,
          bankId,
          caresheetId,
          correspondentId,
          debtorName,
          date,
          description,
          payment,
          paymentDate,
          checkNumber,
          checkBank,
          type,
          amount,
          amountCare,
          amountProsthesis,
        ]);

        // Pour chaque bénéficiaire
        for (const beneficiary of beneficiaries) {
          // Insertion du règlement du bénéficiaire.
          await queryRunner.query(insertToCSC, [
            insertRes.insertId,
            beneficiary.id,
            beneficiary.pivot.amount,
            beneficiary.pivot.amount_care,
            beneficiary.pivot.amount_prosthesis,
          ]);
          // Réinitialise le niveau de relance
          await queryRunner.query(updateToCOU, [
            beneficiary.id,
            practitionerId,
          ]);
        }
      } else {
        const deadlinesCount = deadlines.length;
        const descriptionBis = description || '';
        await Promise.all(
          deadlines.map(async (deadline, deadlineIndex) => {
            let amountCareTemp = 0;
            let amountProsthesisTemp = 0;
            const deadlineAmountCare = deadline?.amount_care;
            const deadlineAmountProsthesis = deadline?.amount_prosthesis;
            const deadlineAmountCareRate = amountCare
              ? this.calculateFloor(deadlineAmountCare, amountCare)
              : 0;
            const deadlineAmountProsthesisRate = amountProsthesis
              ? this.calculateFloor(deadlineAmountProsthesis, amountProsthesis)
              : 0;
            let description = `Echéance n°${
              deadlineIndex + 1
            } sur ${deadlinesCount}`;

            // Insertion d'un nouveau règlement.
            const insertRes = await queryRunner.query(insertToCSG, [
              practitionerId,
              debtorId,
              bankId,
              caresheetId,
              correspondentId,
              debtorName,
              date,
              description,
              payment,
              deadline.date,
              checkNumber,
              checkBank,
              type,
              deadline.amount,
              deadline.amount_care,
              deadline.amount_prosthesis,
            ]);

            // Pour chaque bénéficiaire.
            await Promise.all(
              beneficiaries.map(async (beneficiary, beneficiaryIndex) => {
                let beneficiaryAmountCare = 0;
                let beneficiaryAmountProsthesis = 0;

                if (deadlineIndex === deadlinesCount - 1) {
                  beneficiaryAmountCare = this.calculateRound(
                    beneficiary?.pivot?.amount_care,
                    beneficiary?.amount_care,
                  );
                  beneficiaryAmountProsthesis = this.calculateRound(
                    beneficiary.pivot.amount_prosthesis,
                    beneficiary.amount_prosthesis,
                  );
                } else {
                  if (beneficiaryIndex === beneficiaries.length - 1) {
                    beneficiaryAmountCare = this.calculateRound(
                      deadlineAmountCare,
                      amountCareTemp,
                    );
                    beneficiaryAmountProsthesis = this.calculateRound(
                      deadlineAmountProsthesis,
                      amountProsthesisTemp,
                    );
                  } else {
                    beneficiaryAmountCare = this.calculateCeil(
                      beneficiary.pivot.amount_care,
                      deadlineAmountCareRate,
                    );
                    beneficiaryAmountProsthesis = this.calculateCeil(
                      beneficiary.pivot.amount_prosthesis,
                      deadlineAmountProsthesisRate,
                    );

                    amountCareTemp += beneficiaryAmountCare;
                    amountProsthesisTemp += beneficiaryAmountProsthesis;
                  }
                  beneficiary.amount_care += beneficiaryAmountCare;
                  beneficiary.amount_prosthesis += beneficiaryAmountProsthesis;
                }

                const beneficiaryAmount = this.calculateRound(
                  beneficiaryAmountCare,
                  beneficiaryAmountProsthesis,
                  'plus',
                );

                // Réinitialise le niveau de relance
                await queryRunner.query(insertToCSC, [
                  insertRes.insertId,
                  beneficiary.id,
                  beneficiaryAmount,
                  beneficiaryAmountCare,
                  beneficiaryAmountProsthesis,
                ]);

                // Réinitialise le niveau de relance
                await queryRunner.query(updateToCOU, [
                  beneficiary.id,
                  practitionerId,
                ]);
                description += `${
                  beneficiary.full_name
                } pour un montant total de ${beneficiary.pivot.amount.toFixed(
                  2,
                )}\n`;
              }),
            );
            // Insertion de la description de l'échéance.
            description += '\n' + descriptionBis;
            const q = `UPDATE T_CASHING_CSG
					SET CSG_MSG = ?
					WHERE CSG_ID = ?`;
            await queryRunner.query(q, [description, insertRes.insertId]);
          }),
        );
      }
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new CBadRequestException(err);
    } finally {
      await queryRunner.release();
    }
  }
  // application/Services/Payment.php
  // 553 -> 624
  async update(payload: ContactPaymentUpdateDto) {
    const data = this.refundAmount(payload) as ContactPaymentUpdateDto;

    const date = data?.date || null;
    const paymentDate = data?.payment_date || null;
    const method = data?.payment.toUpperCase() || 'CHEQUE';
    const type = data?.type.toUpperCase() || 'HONORAIRE';
    const checkNumber = data?.check_number || null;
    const checkBank = data?.check_bank || null;
    const description = data?.description || null;
    const amount = data?.amount || 0;
    const amountCare = data?.amount_care || 0;
    const amountProsthesis = data?.amount_prosthesis || 0;
    const practitionerId = data?.practitioner?.id || null;
    const bankId = data?.bank?.id || null;
    const debtorId = data?.debtor?.id || null;
    const debtorName = data?.debtor?.name || null;

    // Champ practitioner.id requis
    if (!practitionerId) {
      throw new CBadRequestException('Invalid practitioner');
    }

    // Bénéficiaires du règlement, uniquement ceux ayant un montant.
    let beneficiaries: IBeneficiary[];
    if (data.beneficiaries && Array.isArray(data.beneficiaries)) {
      beneficiaries = data.beneficiaries.filter((e) => e.pivot.amount);
    }
    const payment = await this.repo.findOneByOrFail({ id: data?.id });
    if (payment) {
      const paymentTemp: CashingEntity = {
        id: payment.id,
        conId: debtorId,
        lbkId: bankId,
        debtor: debtorName,
        msg: description,
        date: date || null,
        paymentDate: paymentDate || null,
        payment: EnumCashingPayment[method],
        type: EnumCashingType[type],
        amount,
        amountCare,
        amountProsthesis,
        checkNumber: checkNumber,
        checkBank: checkBank,
      };

      const insertPayment = await this.repo.save(paymentTemp);
      const paymentPayees: CashingContactEntity[] = beneficiaries.map(
        (beneficiary) => {
          return {
            id: beneficiary?.pivot?.id,
            csgId: insertPayment.id,
            conId: beneficiary.id,
            amount: beneficiary.pivot.amount,
            amountCare: beneficiary.pivot.amount_care,
            amountProsthesis: beneficiary.pivot.amount_prosthesis,
          };
        },
      );
      await this.cashingContactRepo.save(paymentPayees);
      return await this.show(insertPayment.id);
    }

    throw new CBadRequestException('Invalid payment');
  }
  /**
   * application/Services/Payment.php 426 -> 544
   * Retourne les informations du règlement.
   *
   * {
   *	"id": 0,
   *	"date": "",
   * 	"description": null,
   * 	"type": "",
   * 	"payment": "",
   * 	"payment_date": "",
   * 	"amount": 0,
   * 	"amount_care": 0,
   * 	"amount_prosthesis": 0,
   * 	"check_number": null,
   * 	"check_bank": null,
   * 	"practitioner": {
   * 		"id": null
   * 	},
   * 	"debtor": {
   * 		"id": null,
   * 		"name": null
   * 	},
   * 	"bank": {
   * 		"id": null
   * 	},
   * 	"correspondent": {
   * 		"id": null
   * 	},
   * 	"beneficiaries": [
   * 		{
   * 			"id": null,
   * 			"full_name": null,
   * 			"amount_due": 0,
   * 			"amount_due_care": 0,
   * 			"amount_due_prosthesis": 0,
   * 			"pivot": {
   * 				"amount": 0,
   * 				"amount_care": 0,
   * 				"amount_prosthesis": 0
   * 			}
   * 		},
   * 	]
   * }
   *
   * @param  integer $id Identifiant du règlement.
   * @return array Informations du règlement.
   */
  async show(id: number): Promise<ContactPaymentUpdateRes> {
    const select = `
    CSG.CSG_ID AS id,
    CSG.CSG_DATE AS date,
    CSG.CSG_MSG AS description,
    CSG.CSG_PAYMENT_DATE AS payment_date,
    CSG.CSG_PAYMENT AS payment,
    CSG.CSG_TYPE AS type,
    CSG.CSG_CHECK_NBR AS check_number,
    CSG.CSG_CHECK_BANK AS check_bank,
    CSG.CSG_AMOUNT AS amount,
    CSG.amount_care AS amount_care,
    CSG.amount_prosthesis AS amount_prosthesis,
    USR.USR_ID AS practitioner_id,
    USR.USR_LASTNAME AS practitioner_lastname,
    USR.USR_FIRSTNAME AS practitioner_firstname,
    CPD.CPD_ID AS correspondent_id,
    CPD.CPD_LASTNAME AS correspondent_lastname,
    CPD.CPD_FIRSTNAME AS correspondent_firstname,
    CSG.CON_ID AS debtor_id,
    IF (CSG.CON_ID IS NULL, CSG.CSG_DEBTOR, CONCAT_WS(' ', CON.CON_LASTNAME, CON.CON_FIRSTNAME)) AS debtor_name,
    CSG.LBK_ID AS bank_id,
    CSG.FSE_ID AS caresheet_id
    `;
    const results = await this.dataSource
      .createQueryBuilder()
      .select(select)
      .from(CashingEntity, 'CSG')
      .innerJoin(UserEntity, 'USR')
      .leftJoin(ContactEntity, 'CON', 'CON.CON_ID = CSG.CON_ID')
      .leftJoin(CorrespondentEntity, 'CPD', 'CPD.CPD_ID = CSG.correspondent_id')
      .leftJoin(
        ContactUserEntity,
        'cou',
        'cou.con_id = CON.CON_ID AND cou.usr_id = CSG.USR_ID',
      )
      .where('CSG.CSG_ID = :id', { id })
      .andWhere('CSG.USR_ID = USR.USR_ID')
      .getRawOne();

    const selectCaresheet = `
    FSE.FSE_ID AS id,
    FSE.FSE_DATE AS date,
    FSE.FSE_NBR AS number,
    FSE.FSE_AMOUNT AS amount,
    FSE.FSE_AMOUNT_AMO AS amount_amo,
    FSE.FSE_AMOUNT_AMC AS amount_amc,
    FSE.FSE_AMOUNT_ASSURE AS amount_patient
    `;
    const caresheetPR = this.dataSource
      .createQueryBuilder()
      .select(selectCaresheet)
      .from(FseEntity, 'FSE')
      .where('FSE.FSE_ID = :id', { id: results.caresheet_id })
      .getRawOne();

    const selectBeneficiaries = `
    CON.CON_ID AS id,
    CONCAT_WS(' ', CON.CON_LASTNAME, CON.CON_FIRSTNAME) AS full_name,
    cou.cou_amount_due AS amount_due,
    cou.amount_due_care AS amount_due_care,
    cou.amount_due_prosthesis AS amount_due_prosthesis,
    CSC.CSC_ID AS pivot_id,
    CSC.CSC_AMOUNT AS pivot_amount,
    CSC.amount_care AS pivot_amount_care,
    CSC.amount_prosthesis AS pivot_amount_prosthesis
    `;
    const beneficiariesPR = this.dataSource
      .createQueryBuilder()
      .select(selectBeneficiaries)
      .from(CashingContactEntity, 'CSC')
      .innerJoin(ContactEntity, 'CON')
      .leftJoin(
        ContactUserEntity,
        'cou',
        `cou.con_id = CON.CON_ID AND cou.usr_id = :usrId`,
        {
          usrId: results.practitioner_id,
        },
      )
      .where('CSC.CSG_ID = :id', { id })
      .andWhere('CSC.CON_ID = CON.CON_ID')
      .getRawMany();
    let [caresheet, beneficiaries] = await Promise.all([
      caresheetPR,
      beneficiariesPR,
    ]);

    caresheet = caresheet
      ? {
          id: caresheet.id,
          date: caresheet.date,
          number: caresheet.number,
          amount: parseFloat(caresheet.amount),
          amount_amo: parseFloat(caresheet.amount_amo),
          amount_amc: parseFloat(caresheet.amount_amc),
          amount_patient: parseFloat(caresheet.amount_patient),
        }
      : null;

    /** remake beneficiaries follow
     * * {
     * *  id
     * *  full_name
     * *  amount_due
     * *  amount_due_care
     * *  amount_due_prosthesis
     * *  pivot: {
     * **  id
     * **  amount
     * **  amount_care
     * **  amount_prosthesis
     * *  }
     ** }
     *
     *  */
    beneficiaries = beneficiaries
      ? beneficiaries.map((beneficiary) => {
          return {
            id: beneficiary.id,
            full_name: beneficiary.full_name,
            amount_due: beneficiary.amount_due,
            amount_due_care: beneficiary.amount_due_care,
            amount_due_prosthesis: beneficiary.amount_due_prosthesis,
            pivot: {
              id: beneficiary.pivot_id,
              amount: beneficiary.pivot_amount,
              amount_care: beneficiary.pivot_amount_care,
              amount_prosthesis: beneficiary.pivot_amount_prosthesis,
            },
          };
        })
      : null;

    // remake result
    const newResults: ContactPaymentUpdateRes = {
      id: results.id,
      date: results.date,
      description: results.description,
      payment_date: results.payment_date,
      payment: results.payment,
      type: results.type,
      amount: results.amount,
      amount_care: results.amount_care,
      amount_prosthesis: results.amount_prosthesis,
      check_number: results.check_number,
      check_bank: results.check_bank,
      practitioner: {
        id: results.practitioner_id,
        lastname: results.practitioner_lastname,
        firstname: results.practitioner_firstname,
      },
      correspondent: {
        id: results.correspondent_id,
        lastname: results.correspondent_lastname,
        firstname: results.correspondent_firstname,
      },
      bank: {
        id: results.bank_id,
      },
      debtor: {
        id: results.debtor_id,
        name: results.debtor_name,
      },
      beneficiaries,
      caresheet,
    };

    return newResults;
  }

  protected refundAmount(
    inputs: ContactPaymentStoreDto | ContactPaymentUpdateDto,
  ): ContactPaymentStoreDto | ContactPaymentUpdateDto {
    if (inputs.hasOwnProperty('type') && inputs.type === 'remboursement') {
      function walkRecursive(obj) {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            if (key.match(/^amount/)) {
              obj[key] = -Math.abs(obj[key]);
            }
            if (typeof obj[key] === 'object') {
              walkRecursive(obj[key]);
            }
          }
        }
      }
      walkRecursive(inputs);
    }
    return inputs;
  }

  protected calculateRound(
    a: number,
    b: number,
    type?: 'plus' | 'minus',
  ): number {
    type = type || 'minus';
    if (type === 'minus') {
      return Math.round((a - b) * 100) / 100;
    }
    return Math.round((a + b) * 100) / 100;
  }
  protected calculateCeil(a: number, b: number): number {
    return Math.ceil(a * (b / 100) * 100) / 100;
  }
  protected calculateFloor(a: number, b: number): number {
    return Math.floor(((a * 100) / b) * 100) / 100;
  }
}
