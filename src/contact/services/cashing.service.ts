import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as mysql from 'mysql2';
import {
  CashingEntity,
  EnumCashingPayment,
  EnumCashingType,
} from 'src/entities/cashing.entity';
import { DataSource, Repository } from 'typeorm';
import {
  ByDayRes,
  CashingPrintDto,
  CashingQueryOptions,
  PrintCashingTotal,
} from '../dto/cashing.dto';
import { UserEntity } from 'src/entities/user.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { FindContactService } from './find.contact.service';
import { CashingContactEntity } from 'src/entities/cashing-contact.entity';
import { ContactEntity } from 'src/entities/contact.entity';
import { LibraryBankEntity } from 'src/entities/library-bank.entity';
import { FindAllStructDto } from '../dto/findAll.contact.dto';
import { FindPaymentRes, GetExtrasRes } from '../response/cashing.res';
import * as dayjs from 'dayjs';
import * as path from 'path';
import { checkDay } from 'src/common/util/day';
import {
  BankStatement,
  Beneficiaries,
  PatientStatement,
  PaymentInterface,
  SlipCheck,
} from '../../interfaces/interface';
import { DEFAULT_LOCALE } from 'src/constants/default';
import { PrintPDFOptions, customCreatePdf } from 'src/common/util/pdf';
import { checkNumber } from 'src/common/util/number';
import { PDFOptions } from 'puppeteer';

dayjs.locale(DEFAULT_LOCALE);
@Injectable()
export class CashingService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(CashingEntity)
    private readonly cashingRepo: Repository<CashingEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(ContactEntity)
    private readonly contactRepo: Repository<ContactEntity>,
    @InjectRepository(LibraryBankEntity)
    private readonly libraryBankRepo: Repository<LibraryBankEntity>,
    private findContactService: FindContactService,
  ) {}

  async exportPayments(
    user: number,
    conditions: FindAllStructDto[],
  ): Promise<string> {
    try {
      const payments: PaymentInterface[] = [];
      const currentUser = await this.userRepo.findOne({
        select: {
          lastname: true,
          firstname: true,
        },
        where: {
          id: user,
        },
      });
      const fullName = `${currentUser.lastname ?? ''} ${
        currentUser.firstname ?? ''
      } `;

      const where = this.conditionsToSQL(conditions);
      // query table T_CASHING_CSG join many table ....

      let sql = `SELECT
          T_CASHING_CSG.CSG_ID AS id,
          T_CASHING_CSG.CON_ID AS patient_id,
          T_CASHING_CSG.LBK_ID AS bank_id,
          T_CASHING_CSG.SLC_ID AS slip_check_id,
          T_CASHING_CSG.CSG_DATE AS date,
          T_CASHING_CSG.CSG_PAYMENT_DATE AS paymentDate,
          T_CASHING_CSG.CSG_PAYMENT AS payment,
          T_CASHING_CSG.CSG_TYPE AS type,
          T_CASHING_CSG.CSG_AMOUNT AS amount,
          T_CASHING_CSG.amount_care as amountCare,
          T_CASHING_CSG.amount_prosthesis as amountProsthesis,
          T_CASHING_CSG.CSG_DEBTOR AS debtor,
          T_CASHING_CSG.CSG_CHECK_NBR AS checkNbr,
          T_CASHING_CSG.CSG_CHECK_BANK AS checkBank,
          T_CASHING_CSG.CSG_MSG AS msg
        FROM T_CASHING_CSG
        LEFT OUTER JOIN T_CASHING_CONTACT_CSC ON T_CASHING_CONTACT_CSC.CSG_ID = T_CASHING_CSG.CSG_ID
        LEFT OUTER JOIN T_CONTACT_CON ON T_CONTACT_CON.CON_ID = T_CASHING_CONTACT_CSC.CON_ID
        LEFT OUTER JOIN T_LIBRARY_BANK_LBK ON T_LIBRARY_BANK_LBK.LBK_ID = T_CASHING_CSG.LBK_ID
        WHERE T_CASHING_CSG.USR_ID = ? `;

      if (where) {
        sql += `AND ${where} ORDER BY T_CASHING_CSG.CSG_PAYMENT_DATE DESC, T_CASHING_CSG.created_at DESC`;
      } else {
        sql += `ORDER BY T_CASHING_CSG.CSG_PAYMENT_DATE DESC, T_CASHING_CSG.created_at DESC`;
      }

      const statements: PaymentInterface[] = await this.dataSource.query(sql, [
        user,
      ]);

      for (const statement of statements) {
        const payment = statement;
        const id = statement?.id;
        const patientId = statement?.patient_id;
        const bankId = statement?.bank_id;
        const slipCheckId = statement?.slip_check_id;
        // query table T_CONTACT_CON
        const patientStatement: PatientStatement[] = patientId
          ? await this.dataSource.query(
              `SELECT
                T_CONTACT_CON.CON_ID AS id,
                T_CONTACT_CON.CON_NBR AS number,
                T_CONTACT_CON.CON_LASTNAME AS lastname,
                T_CONTACT_CON.CON_FIRSTNAME AS firstname
              FROM T_CONTACT_CON
              WHERE T_CONTACT_CON.CON_ID = ?`,
              [patientId],
            )
          : null;
        payment.patient = patientStatement;

        // query table T_CASHING_CONTACT_CSC Join T_CONTACT_CON
        const beneficiariesStatement: Beneficiaries[] = id
          ? await this.dataSource.query(
              `SELECT
              T_CONTACT_CON.CON_ID AS id,
              T_CONTACT_CON.CON_LASTNAME AS lastname,
              T_CONTACT_CON.CON_FIRSTNAME AS firstname,
              T_CASHING_CONTACT_CSC.CSC_AMOUNT AS amount,
              T_CASHING_CONTACT_CSC.amount_care,
              T_CASHING_CONTACT_CSC.amount_prosthesis
            FROM T_CASHING_CONTACT_CSC
            JOIN T_CONTACT_CON
            WHERE T_CASHING_CONTACT_CSC.CSG_ID = ?
            AND T_CASHING_CONTACT_CSC.CON_ID = T_CONTACT_CON.CON_ID`,
              [id],
            )
          : null;
        payment.beneficiaries = beneficiariesStatement;

        // query table T_LIBRARY_BANK_LBK
        const bankStatement: BankStatement[] = bankId
          ? await this.dataSource.query(
              `SELECT
      T_LIBRARY_BANK_LBK.LBK_ID AS id,
      T_LIBRARY_BANK_LBK.LBK_ACCOUNTING_CODE AS accounting_code,
      T_LIBRARY_BANK_LBK.third_party_account,
      T_LIBRARY_BANK_LBK.product_account,
      T_LIBRARY_BANK_LBK.LBK_NAME as bank_name
  FROM T_LIBRARY_BANK_LBK
  WHERE T_LIBRARY_BANK_LBK.LBK_ID = ?`,
              [bankId],
            )
          : null;
        payment.bank = bankStatement;

        // query table T_SLIP_CHECK_SLC join T_LIBRARY_BANK_LBK
        const slipCheckStatement: SlipCheck[] = slipCheckId
          ? await this.dataSource.query(
              `SELECT
      T_SLIP_CHECK_SLC.SLC_ID AS id,
      T_SLIP_CHECK_SLC.SLC_NBR AS number,
      T_SLIP_CHECK_SLC.SLC_DATE AS date,
      T_SLIP_CHECK_SLC.label,
      T_SLIP_CHECK_SLC.amount,
      T_LIBRARY_BANK_LBK.LBK_NAME AS bank_name
  FROM T_SLIP_CHECK_SLC
  JOIN T_LIBRARY_BANK_LBK
  WHERE T_SLIP_CHECK_SLC.SLC_ID = ?
    AND T_SLIP_CHECK_SLC.LBK_ID = T_LIBRARY_BANK_LBK.LBK_ID`,
              [slipCheckId],
            )
          : null;
        payment.slip_check = slipCheckStatement;
        // ruslt
        payments.push(payment);
      }

      // Tiếp theo, sử dụng payments để tạo tệp CSV và xuất dữ liệu.
      // tạo tệp CSV
      let csvContent =
        'NOTE : Utiliser encodage UTF-8 et comme separateur le point virgule pour la lecture de ce fichier\n';
      csvContent += `PRATICIEN;${fullName};\nN° dossier;Date;Echéance;Débiteur;Mode;No Chèque;Banque;No Bordereau;Type paiement;Montant;Commentaire\n`;

      // Ghi dữ liệu payments vào tệp CSV

      for (const payment of payments) {
        let debiteurNumber = -1;
        let debiteur = payment?.debtor;
        let bankName = '';
        switch (payment?.payment) {
          case 'cheque':
            bankName = payment?.checkBank;
            break;
          default:
            bankName = payment?.bank?.[0]?.bank_name;
            break;
        }

        if (payment.patient && payment.patient.length > 0) {
          debiteurNumber = payment?.patient[0]?.number;
          debiteur =
            payment?.patient[0]?.lastname + payment?.patient?.[0]?.firstname;
        }

        let noBordereau = 0;
        if (payment?.slip_check) {
          noBordereau = payment.slip_check?.[0]?.number;
        }
        csvContent += `${debiteurNumber || ''},${
          payment?.date ? dayjs(payment?.date).format('DD/MM/YYYY') : ''
        },${
          payment?.paymentDate
            ? dayjs(payment?.paymentDate).format('DD/MM/YYYY')
            : ''
        }, "${debiteur ? debiteur : ''}",${payment?.payment || ''},${
          payment?.checkNbr || ''
        },"${bankName}",${noBordereau ? noBordereau : ''},${
          payment?.type || ''
        },${payment?.amount || ''},"${payment?.msg || ''}"\n`;
      }

      return csvContent;
    } catch {
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  // php/cashing/print.php 31
  async print(payload: CashingPrintDto) {
    try {
      const user = await this.userRepo.findOneOrFail({
        where: { id: payload?.user },
      });
      let payments = payload?.contact
        ? await this.findByPatient(payload?.contact)
        : await this.findByDoctor(user?.id, payload?.conditions, {
            order: 'ASC',
          });

      payments = payments?.filter(
        (payment) => payment?.date || payment?.paymentDate,
      );
      const total: PrintCashingTotal = {
        total: {
          total: 0,
        },
      };

      let periodTitle: string;

      switch (payload?.group) {
        case 'day':
          periodTitle = 'Livre des honoraires journaliers';
          break;
        case 'month':
          periodTitle = 'Livre des honoraires mensuels';
          break;
        default:
          periodTitle = 'Journal des encaissements';
          break;
      }

      const filteredConditions = payload?.conditions.filter((condition) =>
        ['csg.date', 'csg.paymentDate'].includes(condition.field),
      );

      if (filteredConditions.length > 0) {
        const periodValues = filteredConditions.map(
          (condition) => new Date(condition.value),
        );
        const periodMin = new Date(
          Math.min(...periodValues.map((date) => date.getTime())),
        );

        const periodMax = new Date(
          Math.max(...periodValues.map((date) => date.getTime())),
        );
        periodTitle += ` du ${dayjs(periodMin).format('DD/MM/YYYY')} au ${dayjs(
          periodMax,
        ).format('DD/MM/YYYY')}`;
      }

      const filePath = path.join(
        process.cwd(),
        'templates/pdf/cashing',
        'cashing.hbs',
      );
      const options: PrintPDFOptions = {
        format: 'A4',
        displayHeaderFooter: true,
        headerTemplate: `<div style="width: 100%;margin: 0 5mm;font-size: 8px; display:flex; justify-content:space-between"><div>${user.lastname} ${user.firstname}</div> <div>Dossiers créditeurs</div></div>`,
        footerTemplate: `<div style="width: 100%;margin-right:10mm; text-align: right; font-size: 8px;"><span class="pageNumber"></span>/<span class="totalPages"></span></div>`,
        margin: {
          left: '5mm',
          top: '25mm',
          right: '5mm',
          bottom: '15mm',
        },
        metadata: {
          title: periodTitle,
        },
      };

      const groupValid = !!(
        payload?.group && ['day', 'month'].includes(payload?.group)
      );
      if (groupValid) {
        const byDay: ByDayRes = {};
        payments.forEach((payment) => {
          const paymentDate = payment?.paymentDate;
          const type = payment?.type;
          const mode = payment?.payment;
          const amount = +Number(payment?.amount).toFixed(2);

          if (type) {
            total[type] = total[type]
              ? { total: total[type]?.total + amount }
              : { total: amount };
          }
          if (mode) {
            total[mode] = total[mode]
              ? { total: +total[mode]?.total + amount }
              : { total: amount };
          }
          const dateTime = paymentDate ? dayjs(paymentDate) : null;
          if (dateTime) {
            let dateFormat = dateTime.format('DD/MM/YYYY');

            if (payload?.group === 'month') {
              dateFormat = dateTime.format('MM/YYYY');
            }

            if (!byDay[dateFormat]) {
              byDay[dateFormat] = { total: 0 };
            }

            if (!byDay[dateFormat][mode]) {
              byDay[dateFormat][mode] = 0;
            }
            byDay[dateFormat][mode] += amount;
            byDay[dateFormat].total += amount;

            total.total.total += amount;
          }
        });
        const data = {
          paymentMethods: Object.entries(EnumCashingPayment),
          paymentTypes: Object.entries(EnumCashingType),
          groupValid,
          total,
          byDay,
        };
        const buffer = await customCreatePdf({
          files: [{ data, path: filePath }],
          options,
          helpers: {
            readAblePayment: (payment: string) => {
              let result = 'Espèce';
              result = payment === 'cheque' ? 'Chèque' : result;
              result = payment === 'carte' ? 'Carte' : result;
              result = payment === 'virement' ? 'Virement' : result;
              result = payment === 'prelevement' ? 'Prélèvement' : result;
              return result;
            },
          },
        });
        return {
          buffer,
          periodTitle,
        };
      } else {
        let amountTotal = 0;
        let amountCareTotal = 0;
        let amountProsthesisTotal = 0;
        const total: any[] = [];
        payments.forEach((payment) => {
          let payer = payment?.debtor;
          const mode = payment?.payment;
          const type = payment?.type;
          let amount = checkNumber(payment?.amount);
          let amountCare = checkNumber(payment?.amount_care);
          let amountProsthesis = checkNumber(payment?.amount_prosthesis);
          // Partie versante
          if (payment?.patient) {
            if (payload?.anonymous) {
              payer = payment?.patient?.number;
            } else {
              payer = `${
                payment?.patient?.number ? payment?.patient?.number + ' - ' : ''
              }${payment?.patient?.lastname || ''} ${
                payment?.patient?.firstname || ''
              }`;
            }
          }
          // Bénéficiaires
          if (payload?.contact && payment?.beneficiaries) {
            amount = +payment?.beneficiaries[0]?.amount;
            amountCare = +payment?.beneficiaries[0]?.amount_care;
            amountProsthesis = +payment?.beneficiaries[0]?.amount_prosthesis;
          }
          amountTotal += amount;
          amountCareTotal += amountCare;
          amountProsthesisTotal += amountProsthesis;
          if (mode) {
            total[mode] = type[mode]
              ? {
                  amount: (type[mode].amount + amount).toFixed(2),
                  amountCare: (type[mode].amountCare + amountCare).toFixed(2),
                  amountProsthesis: (
                    type[mode].amountProsthesis + amountProsthesis
                  ).toFixed(2),
                }
              : {
                  amount: amount.toFixed(2),
                  amountCare: amountCare.toFixed(2),
                  amountProsthesis: amountProsthesis.toFixed(2),
                };
          }

          if (type) {
            total[type] = total[type]
              ? {
                  amount: +(checkNumber(total[type]?.amount) + amount).toFixed(
                    2,
                  ),
                  amountCare: +(
                    checkNumber(total[type]?.amountCare) + amountCare
                  ).toFixed(2),
                  amountProsthesis: +(
                    checkNumber(total[type]?.amountProsthesis) +
                    amountProsthesis
                  ).toFixed(2),
                }
              : {
                  amount: amount.toFixed(2),
                  amountCare: amountCare.toFixed(2),
                  amountProsthesis: amountProsthesis.toFixed(2),
                };
          }

          payment.debtor = payer;
        });

        const data = {
          amountTotal: amountTotal.toFixed(2),
          amountCareTotal: amountCareTotal.toFixed(2),
          amountProsthesisTotal: amountProsthesisTotal.toFixed(2),
          payments,
          groupValid,
          total,
        };

        const buffer = await customCreatePdf({
          files: [{ data, path: filePath }],
          options,
        });
        return {
          buffer,
          periodTitle,
        };
      }
    } catch (error) {
      throw new CBadRequestException(ErrorCode.ERROR_GET_PDF);
    }
  }

  /**
   * application/Services/Cashing.php 46 - 72
   *
   * Retourne le montant total et le nombre de règlements du praticien
   * en fonction des conditions de recherche.
   *
   * @param integer doctorId Identifiant du praticien
   * @param array conditions Conditions de recherche
   * @return array
   */
  async getExtras(
    doctorId: number,
    conditions?: FindAllStructDto[],
  ): Promise<GetExtrasRes> {
    const queryBuilder = this.dataSource.createQueryBuilder();
    const select = `
      CSG.CSG_ID AS id,
      CSG.CSG_AMOUNT AS amount`;
    let qr = queryBuilder
      .select(select)
      .from(CashingEntity, 'CSG')
      .leftJoin(CashingContactEntity, 'CSC', 'CSC.CSG_ID = CSG.CSG_ID')
      .leftJoin(ContactEntity, 'CON', 'CON.CON_ID = CSC.CON_ID')
      .leftJoin(LibraryBankEntity, 'LBK', 'LBK.LBK_ID = CSG.LBK_ID');
    if (conditions && conditions.length > 0) {
      qr = this.findContactService.addWhere(qr, conditions);
    }
    qr.andWhere('CSG.USR_ID = :id', { id: doctorId });
    qr.groupBy('CSG.CSG_ID');
    const result = await qr.getRawMany();
    const amount = result.reduce((a, b) => {
      return a + b.amount;
    }, 0);
    return {
      amount: amount,
      total: result.length,
    };
  }

  /**
   * application/Services/Cashing.php  83 - 214
   *
   * Retourne les règlements du praticien en fonction des conditions
   * de recherche.
   *
   * @param integer doctorId Identifiant du praticien
   * @param array conditions Conditions de recherche
   * @param array options Options de requêtes
   * @return array
   */
  async findByDoctor(
    doctorId: number,
    conditions: FindAllStructDto[],
    options: CashingQueryOptions,
  ): Promise<FindPaymentRes[]> {
    const orderBy = options?.order_by ? options?.order_by : 'paymentDate';
    const order =
      options?.order && /^(asc|desc)/i.test(options.order)
        ? options.order
        : 'desc';
    const limit =
      options?.limit && Number.isInteger(options?.limit)
        ? +options?.limit
        : Number.MAX_SAFE_INTEGER;
    const offset =
      options?.offset && Number.isInteger(options?.offset)
        ? +options?.offset
        : 0;
    let where: string;
    if (conditions && conditions.length > 0) {
      where = this.conditionsToSQL(conditions);
    }

    const patientStatement = `
    SELECT
        T_CONTACT_CON.CON_ID AS id,
        T_CONTACT_CON.CON_NBR AS number,
        T_CONTACT_CON.CON_LASTNAME AS lastname,
        T_CONTACT_CON.CON_FIRSTNAME AS firstname
    FROM T_CONTACT_CON
    WHERE T_CONTACT_CON.CON_ID = ?`;

    const beneficiariesStatement = `
    SELECT
        T_CONTACT_CON.CON_ID AS id,
        T_CONTACT_CON.CON_LASTNAME AS lastname,
        T_CONTACT_CON.CON_FIRSTNAME AS firstname,
        T_CASHING_CONTACT_CSC.CSC_AMOUNT AS amount,
        T_CASHING_CONTACT_CSC.amount_care,
        T_CASHING_CONTACT_CSC.amount_prosthesis
    FROM T_CASHING_CONTACT_CSC
    JOIN T_CONTACT_CON
    WHERE T_CASHING_CONTACT_CSC.CSG_ID = ?
      AND T_CASHING_CONTACT_CSC.CON_ID = T_CONTACT_CON.CON_ID`;

    const slipCheckStatement = `
    SELECT
        T_SLIP_CHECK_SLC.SLC_ID AS id,
        T_SLIP_CHECK_SLC.SLC_NBR AS number,
        T_SLIP_CHECK_SLC.SLC_DATE AS date,
        T_SLIP_CHECK_SLC.label,
        T_SLIP_CHECK_SLC.amount,
        T_LIBRARY_BANK_LBK.LBK_NAME AS bank_name
    FROM T_SLIP_CHECK_SLC
    JOIN T_LIBRARY_BANK_LBK
    WHERE T_SLIP_CHECK_SLC.SLC_ID = ?
      AND T_SLIP_CHECK_SLC.LBK_ID = T_LIBRARY_BANK_LBK.LBK_ID`;

    const bankStatement = `
    SELECT
        T_LIBRARY_BANK_LBK.LBK_ID AS id,
        T_LIBRARY_BANK_LBK.LBK_ACCOUNTING_CODE AS accounting_code,
        T_LIBRARY_BANK_LBK.third_party_account,
        T_LIBRARY_BANK_LBK.product_account
    FROM T_LIBRARY_BANK_LBK
    WHERE T_LIBRARY_BANK_LBK.LBK_ID = ?`;

    const statement = `
        T_CASHING_CSG.CSG_ID AS id,
        T_CASHING_CSG.CON_ID AS patient_id,
        T_CASHING_CSG.LBK_ID AS bank_id,
        T_CASHING_CSG.SLC_ID AS slip_check_id,
        T_CASHING_CSG.CSG_DATE AS date,
        T_CASHING_CSG.CSG_PAYMENT_DATE AS paymentDate,
        T_CASHING_CSG.CSG_PAYMENT AS payment,
        T_CASHING_CSG.CSG_TYPE AS type,
        T_CASHING_CSG.CSG_AMOUNT AS amount,
        T_CASHING_CSG.amount_care,
        T_CASHING_CSG.amount_prosthesis,
        T_CASHING_CSG.CSG_DEBTOR AS debtor`;

    const payments = await this.dataSource
      .createQueryBuilder()
      .select(statement)
      .from(CashingEntity, 'T_CASHING_CSG')
      .leftJoin(
        CashingContactEntity,
        'T_CASHING_CONTACT_CSC',
        'T_CASHING_CONTACT_CSC.CSG_ID = T_CASHING_CSG.CSG_ID',
      )
      .leftJoin(
        ContactEntity,
        'T_CONTACT_CON',
        'T_CONTACT_CON.CON_ID = T_CASHING_CONTACT_CSC.CON_ID',
      )
      .leftJoin(
        LibraryBankEntity,
        'T_LIBRARY_BANK_LBK',
        'T_LIBRARY_BANK_LBK.LBK_ID = T_CASHING_CSG.LBK_ID',
      )
      .where('T_CASHING_CSG.USR_ID = :id', { id: doctorId })
      .andWhere(where)
      .limit(limit)
      .offset(offset)
      .orderBy(orderBy, order === 'DESC' ? 'DESC' : 'ASC')
      .execute();

    const result: FindPaymentRes[] = [];
    for await (const payment of payments) {
      const patient = await this.dataSource.query(patientStatement, [
        payment?.patient_id,
      ]);
      const beneficiaries = await this.dataSource.query(
        beneficiariesStatement,
        [payment?.id],
      );
      const bank = await this.dataSource.query(bankStatement, [
        payment?.bank_id,
      ]);
      const slipCheck = await this.dataSource.query(slipCheckStatement, [
        payment?.slip_check_id,
      ]);

      const paymentDate = checkDay(payment?.paymentDate);
      const date = checkDay(payment?.date);
      result.push({
        ...payment,
        paymentDate,
        date,
        patient: patient[0],
        beneficiaries,
        bank: bank[0],
        slipCheck: slipCheck[0],
      });
    }
    return result;
  }

  // application/Services/Cashing.php 248 -322
  /**
   * Retourne les règlements d'un patient.
   *
   * @param integer patientId Identifiant du patient
   * @return array
   */
  async findByPatient(patientId: number): Promise<FindPaymentRes[]> {
    const patientStatement = `
    SELECT
        T_CONTACT_CON.CON_ID AS id,
        T_CONTACT_CON.CON_NBR AS number,
        T_CONTACT_CON.CON_LASTNAME AS lastname,
        T_CONTACT_CON.CON_FIRSTNAME AS firstname
    FROM T_CONTACT_CON
    WHERE T_CONTACT_CON.CON_ID = ?`;

    const beneficiariesStatement = `
     SELECT
        T_CONTACT_CON.CON_ID AS id,
        T_CONTACT_CON.CON_LASTNAME AS lastname,
        T_CONTACT_CON.CON_FIRSTNAME AS firstname,
        T_CASHING_CONTACT_CSC.CSC_AMOUNT AS amount,
        T_CASHING_CONTACT_CSC.amount_care,
        T_CASHING_CONTACT_CSC.amount_prosthesis
    FROM T_CASHING_CONTACT_CSC
    JOIN T_CONTACT_CON
    WHERE T_CASHING_CONTACT_CSC.CSG_ID = ?
        AND T_CASHING_CONTACT_CSC.CON_ID = T_CONTACT_CON.CON_ID`;

    const statement = `
    SELECT
        T_CASHING_CSG.CSG_ID AS id,
        T_CASHING_CSG.CON_ID AS patient_id,
        T_CASHING_CSG.CSG_DATE AS date,
        T_CASHING_CSG.CSG_PAYMENT_DATE AS paymentDate,
        T_CASHING_CSG.CSG_PAYMENT AS payment,
        T_CASHING_CSG.CSG_TYPE AS type,
        T_CASHING_CSG.CSG_AMOUNT AS amount,
        T_CASHING_CSG.amount_care,
        T_CASHING_CSG.amount_prosthesis,
        T_CASHING_CSG.CSG_DEBTOR AS debtor
    FROM T_CASHING_CONTACT_CSC
    JOIN T_CASHING_CSG
    WHERE T_CASHING_CONTACT_CSC.CON_ID = ?
      AND T_CASHING_CONTACT_CSC.CSG_ID = T_CASHING_CSG.CSG_ID`;

    const payments = await this.dataSource.query(statement, [patientId]);

    const results: FindPaymentRes[] = [];
    for (const payment of payments) {
      const patient = await this.dataSource.query(patientStatement, [
        payment?.patient_id,
      ]);
      const beneficiaries = await this.dataSource.query(
        beneficiariesStatement,
        [payment?.id],
      );
      const paymentDate = checkDay(payment?.paymentDate);
      const date = checkDay(payment?.date);
      results.push({
        ...payment,
        paymentDate,
        date,
        patient: patient[0],
        beneficiaries,
      });
    }

    return results;
  }

  // suport findByDoctor
  private conditionsToSQL(conditions: FindAllStructDto[]): string {
    const conditionFields = {
      'csg.date': 'T_CASHING_CSG.CSG_DATE',
      'csg.paymentDate': 'T_CASHING_CSG.CSG_PAYMENT_DATE',
      'csg.amount': 'T_CASHING_CSG.CSG_AMOUNT',
      'csg.payment': 'T_CASHING_CSG.CSG_PAYMENT',
      'csg.type': 'T_CASHING_CSG.CSG_TYPE',
      'con.nbr': 'T_CONTACT_CON.CON_NBR',
      'con.lastname': 'T_CONTACT_CON.CON_LASTNAME',
      'con.firstname': 'T_CONTACT_CON.CON_FIRSTNAME',
      'lbk.id': 'T_LIBRARY_BANK_LBK.LBK_ID',
      'lbk.name': 'T_LIBRARY_BANK_LBK.LBK_NAME',
      'lbk.abbr': 'T_LIBRARY_BANK_LBK.LBK_ABBR',
    };
    const conditionOperators = {
      gte: '>=',
      eq: '=',
      lte: '<=',
      like: 'LIKE',
    };
    const wheres = [];

    for (const condition of conditions) {
      let conditionUse = condition;

      if (typeof condition === 'string') {
        conditionUse = JSON.parse(condition);
      }

      const operator = conditionUse?.op;
      const value = mysql.escape(conditionUse?.value);
      const field = conditionUse?.field;

      if (conditionFields[field] && conditionOperators[operator]) {
        wheres.push(
          `${conditionFields[field]} ${conditionOperators[operator]} ${value}`,
        );
      }
    }
    return wheres.join(' AND ');
  }
}
