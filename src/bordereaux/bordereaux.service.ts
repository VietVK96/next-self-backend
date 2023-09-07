import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LibraryBankEntity } from 'src/entities/library-bank.entity';
import 'dayjs/locale/fr';
import * as dayjs from 'dayjs';
import * as path from 'path';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { PdfTemplateFile, customCreatePdf } from 'src/common/util/pdf';
import { ErrorCode } from 'src/constants/error';
import {
  EnumSlipCheckPaymentChoice,
  SlipCheckEntity,
} from 'src/entities/slip-check.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { BordereauxDto, BordereauxStoreDto } from './dto/index.dto';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { bordereauSort } from 'src/constants/bordereau';
import { PaymentMethodEnum } from 'src/enum/payment-method.enum';
import { CashingEntity } from 'src/entities/cashing.entity';
import { ContactEntity } from 'src/entities/contact.entity';
import { PaymentTypeEnum } from 'src/enum/payment-type.enum';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { SuccessResponse } from 'src/common/response/success.res';
import { PermissionService } from 'src/user/services/permission.service';
import { PerCode } from 'src/constants/permissions';
import {
  BordereauxIndexItemRes,
  BordereauxIndexRes,
  BordereauxPaymentIndexItemRes,
  BordereauxPaymentIndexRes,
  BordereauxPaymentRes,
  BordereauxRes,
  BordereauxTotalAmountRes,
  BordereauxUserBankRes,
} from './response/bordereaux.res';
import Handlebars from 'handlebars';

@Injectable()
export class BordereauxService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(SlipCheckEntity)
    private readonly slipCheckRepository: Repository<SlipCheckEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(LibraryBankEntity)
    private libraryBankRepository: Repository<LibraryBankEntity>,
    private readonly permissionService: PermissionService,
    @InjectRepository(CashingEntity)
    private readonly cashingRepository: Repository<CashingEntity>,
  ) {}

  /**
   * File php/bordereaux/show.php
   *
   * @param id
   * @returns
   */
  async findOne(id: number): Promise<SlipCheckEntity[]> {
    const slipCheck = await this.slipCheckRepository.find({
      relations: ['libraryBank', 'cashings'],
      where: { id: id },
    });
    return slipCheck;
  }

  /**
   * File: php/bordereaux/index.php
   * Line: 15-> 119
   */
  async getBordereaux(payload: BordereauxDto) {
    const { user_id, direction, page, per_page } = payload;
    const filterParam: string[] = Array.isArray(payload?.filterParam)
      ? payload?.filterParam
      : [payload?.filterParam] || [];
    const filterValue: string[] = Array.isArray(payload?.filterValue)
      ? payload?.filterValue
      : [payload?.filterValue] || [];
    const user = await this.userRepository.findOne({ where: { id: user_id } });
    const banks = await this.libraryBankRepository.find();
    if (!user) {
      throw new CNotFoundRequestException(ErrorCode.NOT_FOUND_USER);
    }

    const queryBuilder = this.dataSource
      .createQueryBuilder()
      .select([
        'bordereau.id as id',
        'bordereau.date as date',
        'bordereau.number as nbr',
        'bordereau.label as label',
        'bordereau.paymentChoice as paymentChoice',
        'bordereau.paymentCount as paymentCount',
        'bordereau.amount as amount',
      ])
      .addSelect(['bank.id as bankId', 'bank.name as bankName'])
      .from(SlipCheckEntity, 'bordereau')
      .innerJoin(LibraryBankEntity, 'bank', 'bordereau.lbkId = bank.id')
      .andWhere('bordereau.userId = :userId', { userId: user?.id });

    filterParam.forEach((param, index) => {
      const valueParam = filterValue[index];
      switch (param) {
        case 'bordereau.creationDate':
          const period = valueParam.split(';');
          if (period[0]) {
            queryBuilder.andWhere('bordereau.date >= :creationDate1', {
              creationDate1: period[0],
            });
          }
          if (period[1]) {
            queryBuilder.andWhere('bordereau.date <= :creationDate2', {
              creationDate2: period[1],
            });
          }
          break;
        case 'bordereau.number':
          queryBuilder.andWhere('bordereau.number LIKE :number', {
            number: `%${valueParam}%`,
          });
          break;
        case 'bordereau.paymentChoice':
          queryBuilder.andWhere('bordereau.paymentChoice LIKE :paymentChoice', {
            paymentChoice: `%${valueParam}%`,
          });
          break;
        case 'bordereau.paymentCount':
          queryBuilder.andWhere('bordereau.paymentCount LIKE :paymentCount', {
            paymentCount: `%${filterValue}%`,
          });
          break;
        case 'bank.id':
          const bank = banks.find((b) => b?.id === parseInt(valueParam));
          if (bank) {
            queryBuilder.andWhere('bank.id = :id', { id: bank?.id });
          }
          break;
      }
    });
    const totalAmountQueryBuilder = queryBuilder.clone();
    totalAmountQueryBuilder.select('SUM(bordereau.amount)', 'totalAmount');
    const totalAmount: BordereauxTotalAmountRes =
      await totalAmountQueryBuilder.getRawOne();
    const totalAmountValue = totalAmount?.totalAmount
      ? parseFloat(totalAmount?.totalAmount)
      : 0;
    const sortList = payload?.sort
      ? [bordereauSort[payload?.sort]]
      : ['bordereau.date', 'bordereau.number'];
    for (const sortItem of sortList) {
      queryBuilder.addOrderBy(
        sortItem,
        direction?.toLocaleLowerCase() === 'asc' ? 'ASC' : 'DESC',
      );
    }
    const queryResult: BordereauxRes[] = await queryBuilder.getRawMany();
    const bordereauxs: BordereauxIndexItemRes[] = queryResult.map((q) => {
      const paymentChoiceReadable =
        PaymentMethodEnum.choices[q?.paymentChoice] ?? '';
      return {
        id: q?.id,
        creation_date: q?.date,
        label: q?.label,
        number: q?.nbr,
        payment_choice: q?.paymentChoice,
        payment_choice_readable: paymentChoiceReadable,
        payment_count: q?.paymentCount,
        amount: q?.amount,
        bank: {
          id: q?.bankId,
          name: q?.bankName,
        },
      };
    });
    const offSet = (page - 1) * per_page;
    const dataPaging = bordereauxs.slice(offSet, offSet + per_page);
    const data: BordereauxIndexRes = {
      current_page_number: page,
      custom_parameters: { sorted: true },
      extra: { total_amount: totalAmountValue },
      items: dataPaging,
      num_item_per_page: per_page,
      paginator_options: {
        defaultSortDirection: 'desc',
        defaultSortFieldName: 'bordereau.creationDate+bordereau.number',
        distinct: false,
        filterFieldParameterName: 'filterParam',
        filterValueParameterName: 'filterValue',
        pageParameterName: 'page',
        sortDirectionParameterName: 'direction',
        sortFieldParameterName: 'sort',
      },
      range: 5,
      total_count: dataPaging?.length,
    };
    return data;
  }

  /**
   * File: php/bordereaux/payments/index.php
   * Line: 15-> 117
   */
  async getBordereauxPayment(payload: BordereauxDto) {
    const { user_id, direction, page, per_page } = payload;
    const filterParam: string[] = Array.isArray(payload?.filterParam)
      ? payload?.filterParam
      : [payload?.filterParam] || [];
    const filterValue: string[] = Array.isArray(payload?.filterValue)
      ? payload?.filterValue
      : [payload?.filterValue] || [];
    const user = await this.userRepository.findOne({ where: { id: user_id } });
    const banks = await this.libraryBankRepository.find();
    if (!user) {
      throw new CNotFoundRequestException(ErrorCode.NOT_FOUND_USER);
    }

    const queryBuilder = this.dataSource
      .createQueryBuilder()
      .select([
        'payment.id as id',
        'payment.debtor as debtor',
        'payment.paymentDate as paymentDate',
        'payment.payment as payment',
        'payment.type as type',
        'payment.amount as amount',
      ])
      .addSelect([
        'payer.id as payerId',
        'payer.lastname as payerLastName',
        'payer.firstname as payerFirstName',
      ])
      .from(CashingEntity, 'payment')
      .leftJoin(ContactEntity, 'payer', 'payment.conId = payer.id')
      .leftJoin(LibraryBankEntity, 'bank', 'payment.lbkId = bank.id')
      .andWhere('payment.usrId = :userId', { userId: user?.id })
      .andWhere('payment.slipCheck IS NULL')
      .andWhere('payment.type != :type', { type: 'remboursement' });

    filterParam.forEach((param, index) => {
      const valueParam = filterValue[index];
      switch (param) {
        case 'payment.paymentDate':
          const period = valueParam.split(';');
          if (period[0]) {
            queryBuilder.andWhere('payment.paymentDate >= :paymentDate1', {
              paymentDate1: period[0],
            });
          }
          if (period[1]) {
            queryBuilder.andWhere('payment.paymentDate <= :paymentDate2', {
              paymentDate2: period[1],
            });
          }
          break;
        case 'payment.method':
          queryBuilder.andWhere('payment.payment = :method', {
            method: valueParam,
          });
          break;
        case 'payment.payer':
          queryBuilder.andWhere(
            '(payment.debtor LIKE :payer OR payer.lastname LIKE :payer OR payer.firstname LIKE :payer)',
            {
              payer: valueParam,
            },
          );
          break;
        case 'bank.id':
          const bank = banks.find((b) => b?.id === parseInt(valueParam));
          if (bank) {
            queryBuilder.andWhere('bank.id = :id', { id: bank?.id });
          }
          break;
      }
    });
    const sortList = payload?.sort
      ? [payload?.sort]
      : ['payment.paymentDate', 'payment.id'];
    for (const sortItem of sortList) {
      queryBuilder.addOrderBy(
        sortItem,
        direction?.toLocaleLowerCase() === 'asc' ? 'ASC' : 'DESC',
      );
    }
    const queryResult: BordereauxPaymentRes[] = await queryBuilder.getRawMany();
    const bordereauxPayment: BordereauxPaymentIndexItemRes[] = queryResult.map(
      (q) => {
        const methodReadable = PaymentMethodEnum.choices[q?.payment] ?? '';
        const typeReadable = PaymentTypeEnum.choices[q?.type] ?? '';
        return {
          id: q?.id,
          label: q?.debtor,
          method: q?.payment,
          method_readable: methodReadable,
          payment_date: q?.paymentDate,
          type: q?.type,
          type_readable: typeReadable,
          amount: q?.amount,
        };
      },
    );
    const offSet = (page - 1) * per_page;
    const dataPaging: BordereauxPaymentIndexItemRes[] = bordereauxPayment.slice(
      offSet,
      offSet + per_page,
    );
    const data: BordereauxPaymentIndexRes = {
      current_page_number: page,
      custom_parameters: { sorted: true },
      items: dataPaging,
      num_item_per_page: per_page,
      paginator_options: {
        defaultSortDirection: 'desc',
        defaultSortFieldName: 'payment.paymentDate+payment.id',
        distinct: false,
        filterFieldParameterName: 'filterParam',
        filterValueParameterName: 'filterValue',
        pageParameterName: 'page',
        sortDirectionParameterName: 'direction',
        sortFieldParameterName: 'sort',
      },
      range: 5,
      total_count: dataPaging?.length,
    };
    return data;
  }

  /**
   * File: php/user/banks/index.php
   * Line: 15-> 43
   */
  async getUserBank(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    const banks = await this.libraryBankRepository.find({
      where: [{ usrId: IsNull() }, { usrId: user?.id }],
      order: {
        pos: 'ASC',
        name: 'ASC',
      },
    });
    const data: BordereauxUserBankRes[] = banks?.map((bank) => {
      return {
        account_number: bank?.accountNumber ?? '',
        agency_code: bank?.branchCode ?? '',
        code: bank?.bankCode ?? '',
        id: bank?.id,
        currency: bank?.currency,
        is_default: !!bank?.isDefault,
        name: bank?.name,
        position: bank?.pos,
        short_name: bank?.abbr,
      };
    });
    return data;
  }

  /**
   * File: php/bordereaux/delete.php
   * Line: 100%
   */

  async delete(id: number, user: UserIdentity): Promise<SuccessResponse> {
    const userId = user.id;
    const bordereau = await this.slipCheckRepository.findOne({
      where: { id: id },
    });

    if (!bordereau) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }

    // check quyền
    const hasPermissionDelete = await this.permissionService.hasPermission(
      PerCode.PERMISSION_DELETE,
      8,
      userId,
    );
    const hasPermissionPaiement = await this.permissionService.hasPermission(
      PerCode.PERMISSION_PAIEMENT,
      8,
      userId,
      bordereau.userId,
    );
    if (!hasPermissionDelete || !hasPermissionPaiement) {
      throw new CBadRequestException(ErrorCode.FORBIDDEN);
    }

    const queryRunner =
      this.slipCheckRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // delete in database
    try {
      const cashing = await this.cashingRepository.find({
        where: {
          slcId: bordereau.id,
        },
      });

      this.cashingRepository
        .createQueryBuilder()
        .update(cashing)
        .set({ slcId: null })
        .where('slcId = :slcId', { slcId: bordereau.id })
        .execute();

      await this.slipCheckRepository.remove(bordereau);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new CBadRequestException(ErrorCode.QUERY_REPOSITORY_ERROR);
    } finally {
      await queryRunner.release();
    }

    return { success: true };
  }

  /**
   *  File php/bordereaux/print.php
   */
  async printPdf(id: number) {
    const slipCheck = await this.slipCheckRepository.find({
      relations: [
        'libraryBank',
        'cashings',
        'cashings.contact',
        'libraryBank.user',
        'libraryBank.group',
        'libraryBank.address',
      ],
      where: { id: id },
    });
    if (slipCheck.length === 0) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND_SLIPCHECK);
    }
    try {
      const data = {
        slipCheck: slipCheck.length > 0 ? slipCheck[0] : {},
      };

      const templates = `<head>
        <title>Bordereau de remise {{slipCheck.number}}</title>
        <style>

          @page {
            margin: 5mm;
            padding: 0;
          }

          body {
            font-family: Arial;
            font-size: 12px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          header {
            margin-bottom: 5mm;
          }

          header table th.titleColumn {
            width: 50%;
          }

          header table th.numberTextColumn,
          header table th.numberColumn {
            width: 25%;
            text-align: right;
          }

          div.accountOwner {
            margin-bottom: 5mm;
          }

          div.bankRib {
            width: 45%;
            background-color: #eeeeee;
            margin-bottom: 10mm;
          }

          div.bankRib table {
            font-size: 12px;
            border-collapse: separate;
            border-spacing: 2mm;
          }

          div.bankRib table td {
            font-size: 12px;
            white-space: nowrap;
          }

          div.bankInformation {
            font-size: 12px;
            margin-bottom: 10mm;
          }

          div.bankInformation table td {
            font-size: 12px;
            width: 50%;
            vertical-align: top;
          }

          div.currency {
            font-size: 12px;
            width: 45%;
            background-color: #eeeeee;
            margin-bottom: 2mm;
            text-align: center;
          }

    div.currency > div {
        padding: 2mm;
    }

    div.payments table thead th,
    div.payments table tbody td {
        border: solid 0.1pt #000000;
    }

    div.payments table th,
    div.payments table td {
        padding: 2mm;
    }

    div.payments table th.payerColumn,
    div.payments table td.payerColumn {
        width: 45%;
    }

    div.payments table th.amountColumn,
    div.payments table td.amountColumn {
        width: 15%;
    }

    div.payments table td.amountColumn {
        font-size: 12px;
        text-align: right;
    }

    div.payments table th.checkNumberColumn,
    div.payments table td.checkNumberColumn,
    div.payments table th.checkBankColumn,
    div.payments table td.checkBankColumn {
        font-size: 12px;
        width: 20%;
    }

    div.payments table td.paymentChoiceCount {
        font-size: 12px;
        text-align: right;
    }

    div.payments.noCheckColumn table th.payerColumn,
    div.payments.noCheckColumn table td.payerColumn {
        font-size: 12px;
        width: 85%;
    }

    div.payments.noCheckColumn table th.checkNumberColumn,
    div.payments.noCheckColumn table td.checkNumberColumn,
    div.payments.noCheckColumn table th.checkBankColumn,
    div.payments.noCheckColumn table td.checkBankColumn {
        font-size: 12px;
        display: none;
    }

    div.paymentDetails table td {
        font-size: 12px;
        padding: 2mm;
    }

    div.paymentDetails table td.amountTotalTitleColumn {
        font-size: 12px;
        text-align: right;
    }

    div.paymentDetails table td.amountTotalColumn {
        font-size: 12px;
        width: 15%;
        text-align: right;
    }

    </style>
</head>
<body>
  <header>
    <table>
      <tbody>
        <tr>
          <th class='titleColumn'>{{slipCheck.label}}</th>
          <th class='numberTextColumn'>N°</th>
          <th class='numberColumn'>{{slipCheck.number}}</th>
        </tr>
      </tbody>
    </table>
  </header>
  <div class='accountOwner'>
    <div>
      Titulaire du compte :
    </div>
    <div>
      Docteur:
      {{#if (isEmpty slipCheck.libraryBank.user)}}
        {{slipCheck.libraryBank.group.name}}
      {{else}}
        Docteur
        {{slipCheck.libraryBank.user.lastname}}
        {{slipCheck.libraryBank.user.firstname}}
      {{/if}}
    </div>
  </div>
  <div class='bankRib'>
    <table>
      <thead>
        <tr>
          <td></td>
          <td>Code bq.</td>
          <td>Guichet</td>
          <td>Numéro compte</td>
          <td>RIB</td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Compte</td>
          <td>
            <strong>{{slipCheck.libraryBank.bankCode}}</strong>
          </td>
          <td>
            <strong>{{slipCheck.libraryBank.branchCode}}</strong>
          </td>
          <td>
            <strong>{{slipCheck.libraryBank.accountNumber}}</strong>
          </td>
          <td>
            <strong>{{slipCheck.libraryBank.bankDetails}}</strong>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class='bankInformation'>
    <table>
      <tbody>
        <tr>
          <td>
            Date:
            {{dateFr slipCheck.createdAt}}
          </td>
          <td>
            <div>
              {{slipCheck.libraryBank.name}}
            </div>
            {{#if (notEmpty slipCheck.libraryBank.address)}}
              <div>
                <div>
                  {{slipCheck.libraryBank.address.street}}
                </div>
                <div>
                  {{slipCheck.libraryBank.address.zipCode}}
                  {{slipCheck.libraryBank.address.city}}
                </div>
              </div>
            {{/if}}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class='currency'>
    <div>
      <strong> Versement en {{slipCheck.libraryBank.currency}}</strong>
    </div>
  </div>
  <div class="payments {{#if (checkPaymentChoice slipCheck.paymentChoice)}} noCheckColumn {{/if}}">
    <table>
      <thead>
        <tr>
          <th class='payerColumn' colspan='2'>Émetteur</th>
          <th class='checkBankColumn'>Banque</th>
          <th class='checkNumberColumn'>N° Chèque</th>
          <th class='amountColumn'>Montant</th>
        </tr>
      </thead>
      <tbody>
        {{#each slipCheck.cashings}}
          <tr>
            <td class='payerColumn' colspan='2'>{{#if this.debtor}} {{this.debtor}} {{else}} {{this.contact.lastname}} {{this.contact.firstname}}{{/if}}</td>
            <td class='checkBankColumn'>{{this.checkBank}}</td>
            <td class='checkNumberColumn'>{{this.checkNumber}}</td>
            <td class='amountColumn'>{{this.amount}}
              {{../slipCheck.libraryBank.currency}}</td>
          </tr>
        {{/each}}
      </tbody>
    </table>
  </div>
  <div class='paymentDetails'>
    <table>
      <tbody>
        <tr>
          <td class='paymentChoiceColumn'>{{count slipCheck.cashings}}
            {{slipCheck.paymentChoice}}</td>
          <td class='amountTotalTitleColumn'>Montant total de la remise :</td>
          <td class='amountTotalColumn'>{{slipCheck.amount}}
            {{slipCheck.libraryBank.currency}}</td>
        </tr>
      </tbody>
    </table>
  </div>
      </body>`;

      Handlebars.registerHelper('dateFr', function (date) {
        return dayjs(date).locale('fr').format('dddd D MMMM YYYY');
      });

      Handlebars.registerHelper('count', function (arr) {
        return arr.length;
      });

      Handlebars.registerHelper('checkPaymentChoice', function (paymentChoice) {
        return paymentChoice !== EnumSlipCheckPaymentChoice.CHEQUE;
      });

      Handlebars.registerHelper('isEmpty', function (v1) {
        if (!v1) {
          return true;
        }
        if (Array?.isArray(v1) || typeof v1 === 'string') {
          return v1.length === 0;
        }
        if (typeof v1 === 'object') {
          return Object.keys(v1).length === 0;
        }
      });

      Handlebars.registerHelper('notEmpty', function (v1) {
        if (Array?.isArray(v1) || typeof v1 === 'string') {
          return v1.length !== 0;
        }
        if (typeof v1 === 'object') {
          return Object.keys(v1).length !== 0;
        }
      });

      return Handlebars.compile(templates)(data);
    } catch (e) {
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  /**
   *  File php/bordereaux/store.php
   */
  async store(payload: BordereauxStoreDto): Promise<SlipCheckEntity> {
    const user = await this.userRepository.findOne({
      where: { id: payload?.user_id },
    });
    if (!user) {
      throw new CNotFoundRequestException(ErrorCode.NOT_FOUND_USER);
    }

    const bank = await this.libraryBankRepository.findOne({
      where: { id: payload.bank_id },
    });

    if (
      !(await this.permissionService.hasPermission(
        PerCode.PERMISSION_PAIEMENT,
        6,
        user.id,
        user.id,
      ))
    ) {
      throw new CBadRequestException(ErrorCode.PERMISSION_DENIED);
    }

    if (payload.payment_id.length === 0) {
      throw new CBadRequestException(ErrorCode.BORDEREAU_PAYMENT_IS_EMPTY);
    }
    try {
      const amounts: { totalAmount: number }[] = await this.dataSource.query(
        `SELECT SUM(payment.CSG_AMOUNT) as totalAmount
       FROM T_CASHING_CSG payment 
       WHERE payment.CSG_ID IN (?) 
        AND payment.USR_ID = ?`,
        [payload.payment_id, user.id],
      );

      const slipcheck = new SlipCheckEntity();
      slipcheck.organizationId = user.organizationId;
      slipcheck.userId = user.id;
      slipcheck.bank = bank;
      slipcheck.number = bank.slipCheckNbr;
      slipcheck.paymentChoice =
        EnumSlipCheckPaymentChoice[payload.payment_choice.toLocaleUpperCase()];
      slipcheck.paymentCount = payload.payment_id.length;
      slipcheck.amount =
        amounts?.length > 0 && amounts?.[0].totalAmount
          ? amounts[0].totalAmount
          : 0;
      slipcheck.label = `bordereau de remise de ${payload.payment_id.length} ${payload.payment_choice}`;

      const newSlipcheck = await this.slipCheckRepository.save(slipcheck);

      const payments = await this.cashingRepository.find({
        where: {
          id: In(payload.payment_id),
          usrId: payload.user_id,
        },
      });

      const updatePayments = payments.map((item) => {
        return {
          ...item,
          slcId: newSlipcheck.id,
          bank,
        };
      });

      await this.cashingRepository.save(updatePayments);

      return newSlipcheck;
    } catch (err) {
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }
}
