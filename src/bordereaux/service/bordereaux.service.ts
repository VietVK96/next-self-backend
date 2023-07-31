import { ContactEntity } from 'src/entities/contact.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { ThirdPartyAmcEntity } from 'src/entities/third-party-amc.entity';
import { ThirdPartyAmoEntity } from 'src/entities/third-party-amo.entity';
import { AmoEntity } from 'src/entities/amo.entity';
import { AmcEntity } from 'src/entities/amc.entity';
import { FseEntity } from 'src/entities/fse.entity';
import { format, parseISO } from 'date-fns';
import { Parser } from 'json2csv';
import { Response } from 'express';
import { BordereauxDto } from '../dto/index.dto';
import { SlipCheckEntity } from 'src/entities/slip-check.entity';
import { LibraryBankEntity } from 'src/entities/library-bank.entity';
import { bordereauSort } from 'src/constants/bordereau';
import { PaymentMethodEnum } from 'src/enum/payment-method.enum';
import { PaymentTypeEnum } from 'src/enum/payment-type.enum';
import { CashingEntity } from 'src/entities/cashing.entity';

@Injectable()
export class BordereauxService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(LibraryBankEntity)
    private libraryBankRepository: Repository<LibraryBankEntity>,
  ) {}

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
      throw new CNotFoundRequestException('User Not Found');
    }

    const queryBuilder = this.dataSource
      .createQueryBuilder()
      .select([
        'bordereau.id as id',
        'bordereau.date as date',
        'bordereau.nbr as nbr',
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
          queryBuilder.andWhere('bordereau.nbr LIKE :number', {
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
    const totalAmount = await totalAmountQueryBuilder.getRawOne();
    const totalAmountValue = totalAmount?.totalAmount
      ? parseFloat(totalAmount?.totalAmount)
      : 0;
    const sortList = payload?.sort
      ? [bordereauSort[payload?.sort]]
      : ['bordereau.date', 'bordereau.nbr'];
    for (const sortItem of sortList) {
      queryBuilder.addOrderBy(
        sortItem,
        direction?.toLocaleLowerCase() === 'asc' ? 'ASC' : 'DESC',
      );
    }
    const queryResult = await queryBuilder.getRawMany();
    const bordereauxs = queryResult.map((q) => {
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
    const data = {
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
      throw new CNotFoundRequestException('User Not Found');
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
    const queryResult = await queryBuilder.getRawMany();
    const bordereauxPayment = queryResult.map((q) => {
      const methodReadable = PaymentMethodEnum.choices[q?.payment] ?? '';
      const typeReadable = PaymentTypeEnum.choices[q?.type] ?? '';
      return {
        id: q?.id,
        creation_date: q?.date,
        label: q?.debtor,
        method: q?.payment,
        method_readable: methodReadable,
        payment_date: q?.paymentDate,
        type: q?.type,
        type_readable: typeReadable,
        amount: q?.amount,
      };
    });
    const offSet = (page - 1) * per_page;
    const dataPaging = bordereauxPayment.slice(offSet, offSet + per_page);
    const data = {
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
    const data = banks?.map((bank) => {
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
}
