import { Injectable } from '@nestjs/common';
import { QueryParamsDto } from '../dto/query-recipe.dto';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
// import { ErrorCode } from 'src/constants/error';
import { DataSource } from 'typeorm';
import { CashingEntity } from 'src/entities/cashing.entity';
import { FlexigridRow } from 'src/common/formatter/flexigrid-row';
import { Condition, Extras, Options } from '../interface/interface';

@Injectable()
export class RecipeService {
  constructor(private dataSource: DataSource) {}

  private slipCheckIds: any[] = [];

  async findAll(queryParams: QueryParamsDto, user: UserIdentity) {
    const response = {
      page: 0,
      total: 0,
      rows: [],
      customs: {
        amount: 0,
      },
    };
    // fomart money
    const numberFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    });
    const doctorId = user.id;
    const options = {
      limit: queryParams.rp,
      offset: (queryParams.page - 1) * queryParams.rp,
      order_by: queryParams.sortname,
      order: queryParams.sortorder,
    };
    const extra = await this.getExtras(doctorId, queryParams.conditions);

    try {
      // get payment from database
      const payments = await this.findByDoctor(
        doctorId,
        queryParams.conditions,
        options,
      );

      // procces payment to return response
      payments.forEach((payment) => {
        const id = payment['id'];
        let debtor = payment['debtor'];
        const entryDate = payment.date;
        const date = payment['paymentDate'];
        const mode = payment['payment'];
        const type = payment['type'];
        const amount = payment['amount'];
        const amountCare = payment['amount_care'];
        const amountProsthesis = payment['amount_prosthesis'];
        let classNames = '';
        let beneficiaries = '';
        let checkbox = '';

        if (new Date(date)?.getTime() > new Date().getTime()) {
          classNames = 'planned';
        }

        if (
          payment['patient'] &&
          payment['patient'] != null &&
          payment['patient'].length !== 0
        ) {
          debtor = `${payment['patient'][0]['lastname']} ${payment['patient'][0]['firstname']}`;
        }

        payment['beneficiaries'].forEach((beneficiary) => {
          beneficiaries += `<dt style="text-align: left;">${
            beneficiary['lastname']
          } ${beneficiary['firstname']}</dt><dd>${numberFormatter.format(
            beneficiary['amount'],
          )}</dd>`;
        });

        let label = debtor;
        if (beneficiaries.length > 0) {
          label = `<details><summary>${debtor}</summary><div style="padding-left: 12px;"><dl class="dl-horizontal">${beneficiaries}</dl></div></details>`;
        }

        if (payment['slip_check'] && payment['slip_check'].length > 0) {
          const slipCheckId = payment['slip_check'][0].id;
          let slipCheckDate = payment['slip_check'][0]['date'];
          const slipCheckNumber = payment['slip_check'][0]['number'];
          const slipCheckName = `<a href="javascript:void(0);" class="showBordereau">${payment['slip_check'][0]['label']} - #${slipCheckNumber} - ${payment['slip_check'][0]['bank_name']}</a>`;

          // Vérification si le bordereau de remise de chèque n'a pas déjà été affiché
          if (!this.slipCheckIds.includes(slipCheckId)) {
            try {
              slipCheckDate = new Date(slipCheckDate);
            } catch (error) {
              // Xử lý lỗi (nếu cần thiết)
            }

            const row = new FlexigridRow();
            row.addCell('');
            row.addCell(slipCheckDate);
            row.addCell('');
            row.addCell(slipCheckName);
            row.addCell('');
            row.addCell('');
            row.addCell(payment['slip_check'][0]['amount']);
            row.addCell('');
            row.addCell('');
            row.addCell('<i class="fas fa-print printBordereau"></i>');
            row.addCell('');
            row.setId(`:depositslip:${slipCheckId}`);
            response.rows.push(row);
          }
          this.slipCheckIds.push(slipCheckId);
          checkbox = `<i class="fas fa-check-circle" title="${'Bordereau de remise de chèque'} n°${slipCheckNumber}"></i>`;
        } else if (mode === 'cheque' && type !== 'remboursement') {
          checkbox = '';
        }
        const row = new FlexigridRow();
        row.addClassName(classNames);
        row.addCell(checkbox);
        row.addCell(entryDate);
        row.addCell(date);
        row.addCell(label);
        row.addCell(mode);
        row.addCell(type);
        row.addCell(amount);
        row.addCell(amountCare);
        row.addCell(amountProsthesis);
        row.addCell('<i class="fas fa-pen" title="Modifier"></i>');
        row.addCell('<i class="fas fa-trash" title="Supprimer"></i>');
        row.setId(`:recipe:${id}`);

        response.rows.push(row);
      });
    } catch (e) {
      throw new CBadRequestException(e);
    }

    response.page = queryParams.page;
    response.total = extra.total;
    response.customs.amount = extra.amount;
    console.log('extra', extra);

    return response;
  }

  // Query table from database
  async findByDoctor(
    doctorId: number,
    conditions: Condition[] = [],
    options: Options = {
      limit: 0,
      offset: 0,
      order_by: '',
      order: '',
    },
  ): Promise<CashingEntity[]> {
    const payments: CashingEntity[] = [];

    const orderBy = options.order_by || 'paymentDate';

    const order =
      options.order && /^(asc|desc)$/i.test(options.order)
        ? options.order
        : 'DESC';
    const limit = options.limit
      ? typeof options.limit === 'string'
        ? parseInt(options.limit, 10)
        : options.limit
      : 50;
    const offset = options.offset
      ? typeof options.offset === 'string'
        ? parseInt(options.offset, 10)
        : options.offset
      : 0;

    const where = this.conditionsToSQL(conditions);
    // query table T_CASHING_CSG join many table ....
    const statement = await this.dataSource.query(
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
      T_CASHING_CSG.amount_care,
      T_CASHING_CSG.amount_prosthesis,
      T_CASHING_CSG.CSG_DEBTOR AS debtor
  FROM T_CASHING_CSG
  LEFT OUTER JOIN T_CASHING_CONTACT_CSC ON T_CASHING_CONTACT_CSC.CSG_ID = T_CASHING_CSG.CSG_ID
  LEFT OUTER JOIN T_CONTACT_CON ON T_CONTACT_CON.CON_ID = T_CASHING_CONTACT_CSC.CON_ID
  LEFT OUTER JOIN T_LIBRARY_BANK_LBK ON T_LIBRARY_BANK_LBK.LBK_ID = T_CASHING_CSG.LBK_ID
  WHERE T_CASHING_CSG.USR_ID = ?${where} GROUP BY T_CASHING_CSG.CSG_ID ORDER BY ${orderBy} ${order}, T_CASHING_CSG.created_at DESC LIMIT ? OFFSET ?`,
      [doctorId, limit, offset],
    );

    let counter = 0;
    while (counter < statement.length) {
      const payment = statement[counter];
      const id = statement[counter]['id'];
      const patientId = statement[counter]['patient_id'];
      const bankId = statement[counter]['bank_id'];
      const slipCheckId = statement[counter]['slip_check_id'];
      // query table T_CONTACT_CON
      const patientStatement = await this.dataSource.query(
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
      const beneficiariesStatement = await this.dataSource.query(
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
      const bankStatement = await this.dataSource.query(
        `SELECT
      T_LIBRARY_BANK_LBK.LBK_ID AS id,
      T_LIBRARY_BANK_LBK.LBK_ACCOUNTING_CODE AS accounting_code,
      T_LIBRARY_BANK_LBK.third_party_account,
      T_LIBRARY_BANK_LBK.product_account
  FROM T_LIBRARY_BANK_LBK
  WHERE T_LIBRARY_BANK_LBK.LBK_ID = ?`,
        [bankId],
      );
      payment.bank = bankStatement;

      // query table T_SLIP_CHECK_SLC join T_LIBRARY_BANK_LBK
      const slipCheckStatement = await this.dataSource.query(
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
      counter++;
    }
    return payments;
  }

  // suport findByDoctor
  private conditionsToSQL(conditions: Condition[]): string {
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
      const operator = conditionUse['op'];
      const value = conditionUse['value'];
      const field = conditionUse['field'];

      if (conditionFields[field] && conditionOperators[operator]) {
        wheres.push(
          `${conditionFields[field]} ${conditionOperators[operator]} "${value}"`,
        );
      }
    }

    return wheres.length > 0 ? ' AND ' + wheres.join(' AND ') : '';
  }

  async getExtras(
    doctorId: number,
    conditions: Condition[] = [],
  ): Promise<Extras> {
    const where = this.conditionsToSQL(conditions);
    const response: Extras = { total: 0, amount: 0 };

    const statement = await this.dataSource.query(
      `SELECT
    COUNT(t1.id) AS total,
    SUM(t1.amount) AS amount
FROM (
    SELECT
        T_CASHING_CSG.CSG_ID AS id,
        T_CASHING_CSG.CSG_AMOUNT AS amount
    FROM T_CASHING_CSG
    LEFT OUTER JOIN T_CASHING_CONTACT_CSC ON T_CASHING_CONTACT_CSC.CSG_ID = T_CASHING_CSG.CSG_ID
    LEFT OUTER JOIN T_CONTACT_CON ON T_CONTACT_CON.CON_ID = T_CASHING_CONTACT_CSC.CON_ID
    LEFT OUTER JOIN T_LIBRARY_BANK_LBK ON T_LIBRARY_BANK_LBK.LBK_ID = T_CASHING_CSG.LBK_ID
    WHERE T_CASHING_CSG.USR_ID = ?
      ${where}
    GROUP BY T_CASHING_CSG.CSG_ID
) AS t1`,
      [doctorId],
    );

    response.total = statement[0]['total'];
    response.amount = statement[0]['amount'];
    console.log(statement, response);

    return response;
  }
}
