import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
import { SlipCheckEntity } from 'src/entities/slip-check.entity';
import * as dayjs from 'dayjs';
import { DEFAULT_LOCALE } from 'src/constants/locale';
import * as path from 'path';
import { createPdf } from '@saemhco/nestjs-html-pdf';
import { checkDay } from 'src/common/util/day';
import {
  BankStatement,
  Beneficiaries,
  PatientStatement,
  PaymentInterface,
  SlipCheck,
} from '../../interfaces/interface';

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
    const payments: PaymentInterface[] = [];

    const where = this.conditionsToSQL(conditions);
    // query table T_CASHING_CSG join many table ....
    const statements: PaymentInterface[] = await this.dataSource.query(
      `SELECT
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
  WHERE T_CASHING_CSG.USR_ID = ?${where}  ORDER BY T_CASHING_CSG.CSG_PAYMENT_DATE DESC, T_CASHING_CSG.created_at DESC`,
      [user],
    );

    for (const statement of statements) {
      const payment = statement;
      const id = statement?.id;
      const patientId = statement?.patient_id;
      const bankId = statement?.bank_id;
      const slipCheckId = statement?.slip_check_id;
      // query table T_CONTACT_CON
      const patientStatement: PatientStatement[] = await this.dataSource.query(
        `SELECT
      T_CONTACT_CON.CON_ID AS id,
      T_CONTACT_CON.CON_NBR AS number,
      T_CONTACT_CON.CON_LASTNAME AS lastname,
      T_CONTACT_CON.CON_FIRSTNAME AS firstname
  FROM T_CONTACT_CON
  WHERE T_CONTACT_CON.CON_ID = ?`,
        [patientId],
      );
      payment.patient = patientStatement;

      // query table T_CASHING_CONTACT_CSC Join T_CONTACT_CON
      const beneficiariesStatement: Beneficiaries[] =
        await this.dataSource.query(
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
        );
      payment.beneficiaries = beneficiariesStatement;

      // query table T_LIBRARY_BANK_LBK
      const bankStatement: BankStatement[] = await this.dataSource.query(
        `SELECT
      T_LIBRARY_BANK_LBK.LBK_ID AS id,
      T_LIBRARY_BANK_LBK.LBK_ACCOUNTING_CODE AS accounting_code,
      T_LIBRARY_BANK_LBK.third_party_account,
      T_LIBRARY_BANK_LBK.product_account,
      T_LIBRARY_BANK_LBK.LBK_NAME as bank_name
  FROM T_LIBRARY_BANK_LBK
  WHERE T_LIBRARY_BANK_LBK.LBK_ID = ?`,
        [bankId],
      );
      payment.bank = bankStatement;

      // query table T_SLIP_CHECK_SLC join T_LIBRARY_BANK_LBK
      const slipCheckStatement: SlipCheck[] = await this.dataSource.query(
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
      );
      payment.slip_check = slipCheckStatement;
      // ruslt
      payments.push(payment);
    }

    // Tiếp theo, sử dụng payments để tạo tệp CSV và xuất dữ liệu.
    // tạo tệp CSV
    let csvContent =
      'NOTE : Utiliser encodage UTF-8 et comme separateur le point virgule pour la lecture de ce fichier\n';
    csvContent += `PRATICIEN;PRATICIEN_NAME\n`;

    // Ghi dữ liệu payments vào tệp CSV

    for (const payment of payments) {
      let debiteurNumber = -1;
      let debiteur = payment?.debtor;
      let bankName = '';
      switch (payment?.payment) {
        case 'cheque':
          bankName = payment?.checkBank;
        default:
          bankName = payment?.bank[0]?.bank_name;
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
      const total: PrintCashingTotal = {};

      const filePath = path.join(
        process.cwd(),
        'templates/pdf/cashing',
        'cashing.hbs',
      );
      const options = {
        format: 'A4',
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: '<div></div>',
        margin: {
          left: '10mm',
          top: '25mm',
          right: '10mm',
          bottom: '15mm',
        },
        landscape: true,
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
              ? { total: +total[type]?.total.toFixed(2) }
              : { total: 0 };
          }
          if (mode) {
            total[mode] = total[mode]
              ? { total: +total[mode]?.total.toFixed(2) }
              : { total: 0 };
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

            byDay[dateFormat].total = +amount;
            if (!byDay[dateFormat][mode]) {
              byDay[dateFormat][mode] = 0;
            }
            byDay[dateFormat][mode] += +amount;
          }
        });
        const data = {
          paymentMethods: Object.entries(EnumCashingPayment),
          paymentTypes: Object.entries(EnumCashingType),
          groupValid,
          total,
          byDay,
        };

        return await createPdf(filePath, options, data);
      } else {
        let amountTotal = 0;
        let amountCareTotal = 0;
        let amountProsthesisTotal = 0;
        const total: any[] = [];
        payments.forEach((payment) => {
          let payer = payment?.debtor;
          const mode = payment?.payment;
          const type = payment?.type;
          let amount = +payment?.amount;
          let amountCare = +payment?.amount_care;
          let amountProsthesis = +payment?.amount_prosthesis;
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
                    amount: type[mode].amount + amount,
                    amountCare: type[mode].amountCare + amountCare,
                    amountProsthesis:
                      type[mode].amountProsthesis + amountProsthesis,
                  }
                : {
                    amount: amount,
                    amountCare: amountCare,
                    amountProsthesis: amountProsthesis,
                  };
            }

            if (type) {
              total[type] = total[type]
                ? {
                    amount: +(total[type].amount + amount).toFixed(2),
                    amountCare: +(total[type].amountCare + amountCare).toFixed(
                      2,
                    ),
                    amountProsthesis: +(
                      total[type].amountProsthesis + amountProsthesis
                    ).toFixed(2),
                  }
                : {
                    amount: amount,
                    amountCare: amountCare,
                    amountProsthesis: amountProsthesis,
                  };
            }

            payment.debtor = payer;
          }
        });

        const data = {
          amountTotal: amountTotal.toFixed(2),
          amountCareTotal: amountCareTotal.toFixed(2),
          amountProsthesisTotal: amountProsthesisTotal.toFixed(2),
          payments,
          groupValid,
          total,
        };

        return await createPdf(filePath, options, data);
      }
    } catch (error) {
      return new CBadRequestException(ErrorCode.ERROR_GET_PDF);
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
    const beneficiaryQueryBuilder = this.dataSource.createQueryBuilder();
    const selectBeneficiaries = `
          CON.CON_ID AS id,
          CON.CON_LASTNAME AS lastname,
          CON.CON_FIRSTNAME AS firstname,
          CSC.CSC_AMOUNT AS amount,
          CSC.amount_care,
          CSC.amount_prosthesis`;
    const qrBeneficiaries = beneficiaryQueryBuilder
      .select(selectBeneficiaries)
      .from(CashingContactEntity, 'CSC')
      .innerJoin(ContactEntity, 'CON');

    const slipCheckQueryBuilder = this.dataSource.createQueryBuilder();
    const selectSlipCheck = `
          SLC.SLC_ID AS id,
          SLC.SLC_NBR AS number,
          SLC.SLC_DATE AS date,
          SLC.label,
          SLC.amount,
          LBK.LBK_NAME AS bank_name`;
    const qrSlipCheck = slipCheckQueryBuilder
      .select(selectSlipCheck)
      .from(SlipCheckEntity, 'SLC')
      .innerJoin(LibraryBankEntity, 'LBK');

    const paymentQueryBuilder = this.dataSource.createQueryBuilder();
    const selectPayments = `
      CSG.CSG_ID AS id,
      CSG.CON_ID AS patient_id,
      CSG.LBK_ID AS bank_id,
      CSG.SLC_ID AS slip_check_id,
      CSG.CSG_DATE AS date,
      CSG.CSG_PAYMENT_DATE AS paymentDate,
      CSG.CSG_PAYMENT AS payment,
      CSG.CSG_TYPE AS type,
      CSG.CSG_AMOUNT AS amount,
      CSG.amount_care,
      CSG.amount_prosthesis,
      CSG.CSG_DEBTOR AS debtor
    `;
    let qrPayment = paymentQueryBuilder
      .select(selectPayments)
      .from(CashingEntity, 'CSG')
      .leftJoin(CashingContactEntity, 'CSC', 'CSC.CSG_ID = CSG.CSG_ID')
      .leftJoin(ContactEntity, 'CON', 'CON.CON_ID = CSC.CON_ID')
      .leftJoin(LibraryBankEntity, 'LBK', 'LBK.LBK_ID = CSG.LBK_ID');
    if (conditions && conditions.length > 0) {
      qrPayment = this.findContactService.addWhere(qrPayment, conditions);
    }
    qrPayment
      .andWhere('CSG.USR_ID = :id', { id: doctorId })
      .groupBy('CSG.CSG_ID')
      .orderBy(`${orderBy} ${order}, CSG.created_at DESC`)
      .limit(limit)
      .offset(offset);
    const payments = await qrPayment.getRawMany();
    const result: FindPaymentRes[] = [];
    for (const payment of payments) {
      const patient = await this.contactRepo.findOne({
        where: { id: payment.patient_id },
      });
      const beneficiaries = await qrBeneficiaries
        .where('CSC.CSG_ID = :id', { id: payment.id })
        .andWhere('CSC.CON_ID = CON.CON_ID')
        .getRawMany();
      const bank = await this.libraryBankRepo.findOne({
        where: { id: payment.bank_id },
      });
      const slipCheck = await qrSlipCheck
        .where('SLC.SLC_ID = :id', { id: payment.slip_check_id })
        .andWhere('SLC.LBK_ID = LBK.LBK_ID')
        .getRawOne();
      const paymentDate = checkDay(payment?.paymentDate);
      const date = checkDay(payment?.date);
      result.push({
        ...payment,
        paymentDate,
        date,
        patient,
        beneficiaries,
        bank,
        slipCheck,
      });

      return result;
    }
  }

  // application/Services/Cashing.php 248 -322
  /**
   * Retourne les règlements d'un patient.
   *
   * @param integer patientId Identifiant du patient
   * @return array
   */
  async findByPatient(patientId: number): Promise<FindPaymentRes[]> {
    const beneficiaryQueryBuilder = this.dataSource.createQueryBuilder();
    const selectBeneficiaries = `
          CON.CON_ID AS id,
          CON.CON_LASTNAME AS lastname,
          CON.CON_FIRSTNAME AS firstname,
          CSC.CSC_AMOUNT AS amount,
          CSC.amount_care,
          CSC.amount_prosthesis`;
    const qrBeneficiaries = beneficiaryQueryBuilder
      .select(selectBeneficiaries)
      .from(CashingContactEntity, 'CSC')
      .innerJoin(ContactEntity, 'CON');

    const paymentQueryBuilder = this.dataSource.createQueryBuilder();
    const selectPayments = `
      CSG.CSG_ID AS id,
      CSG.CON_ID AS patient_id,
      CSG.CSG_DATE AS date,
      CSG.CSG_PAYMENT_DATE AS paymentDate,
      CSG.CSG_PAYMENT AS payment,
      CSG.CSG_TYPE AS type,
      CSG.CSG_AMOUNT AS amount,
      CSG.amount_care,
      CSG.amount_prosthesis,
      CSG.CSG_DEBTOR AS debtor
    `;
    const payments = await paymentQueryBuilder
      .select(selectPayments)
      .from(CashingContactEntity, 'CSC')
      .innerJoin(CashingEntity, 'CSG')
      .where('CSC.CON_ID = :id', { id: patientId })
      .andWhere('CSC.CSG_ID = CSG.CSG_ID')
      .getRawMany();
    const results: FindPaymentRes[] = [];
    for (const payment of payments) {
      const patient = await this.contactRepo.findOne({
        where: { id: patientId },
      });
      const beneficiaries = await qrBeneficiaries
        .where('CSC.CSG_ID = :id', { id: payment.id })
        .andWhere('CSC.CON_ID = CON.CON_ID')
        .getRawMany();
      const paymentDate = checkDay(payment?.paymentDate);
      const date = checkDay(payment?.date);
      results.push({
        ...payment,
        paymentDate,
        date,
        patient,
        beneficiaries,
      });
    }

    return results;
  }

  // suport findByDoctor
  private conditionsToSQL(conditions: FindAllStructDto[]): string {
    const conditionFields = {
      // Định nghĩa các trường điều kiện tại đây
      // Ví dụ:
      // field1: 'table_name.field1',
      // field2: 'table_name.field2',
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
      // Định nghĩa các toán tử điều kiện tại đây
      // Ví dụ:
      // equals: '=',
      // greaterThan: '>',
      // lessThan: '<',
      // ...
      gte: '>=',
      eq: '=',
      lte: '<=',
      like: 'LIKE',
    };
    // Viết hàm chuyển đổi các điều kiện thành câu SQL tương tự như trước đó
    // (Ví dụ: AND field1 = value1 AND field2 > value2 ...)
    // Hàm này không cần sửa đổi nếu logic xử lý điều kiện không thay đổi.
    // Return câu điều kiện SQL được tạo ra từ mảng conditions.
    const wheres = [];

    for (const condition of conditions) {
      let conditionUse = condition;

      if (typeof condition === 'string') {
        conditionUse = JSON.parse(condition);
      }
      const operator = conditionUse?.op;
      const value = conditionUse?.value;
      const field = conditionUse?.field;

      if (conditionFields[field] && conditionOperators[operator]) {
        wheres.push(
          `${conditionFields[field]} ${conditionOperators[operator]} "${value}"`,
        );
      }
    }

    return wheres.length > 0 ? ' AND ' + wheres.join(' AND ') : '';
  }
}
