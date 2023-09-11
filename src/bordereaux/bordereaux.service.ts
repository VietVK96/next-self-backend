import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LibraryBankEntity } from 'src/entities/library-bank.entity';
import 'dayjs/locale/fr';
import * as dayjs from 'dayjs';
import * as fs from 'fs';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
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
import * as path from 'path';

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

      const templates = fs.readFileSync(
        path.join(__dirname, '../../templates/bordereaux/index.hbs'),
        'utf-8',
      );

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
