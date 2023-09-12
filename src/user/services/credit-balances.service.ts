import { Injectable } from '@nestjs/common';
import { printUnpaidDto } from '../dto/unpaid.dto';
import * as dayjs from 'dayjs';
import { unpaidSort } from 'src/constants/unpaid';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { Parser } from 'json2csv';
import { IPatientBalances } from 'src/interfaces/interface';
import { CreditBalancesDto } from '../dto/credit-balances.dto';
import { UserEntity } from 'src/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import Handlebars from 'handlebars';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class CreditBalancesService {
  constructor(
    @InjectRepository(ContactUserEntity)
    private patientBalanceRepo: Repository<ContactUserEntity>,
    @InjectRepository(UserPreferenceEntity)
    private userPreferenceRepo: Repository<UserPreferenceEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private configService: ConfigService,
  ) {}

  /**
   *php/user/credit-balances/print.php 100%
   */
  async printCreditBalances(param: printUnpaidDto) {
    const user = await this.userRepository.findOne({
      where: { id: param?.id },
    });
    if (!user) {
      throw new CNotFoundRequestException(ErrorCode.NOT_FOUND_USER);
    }
    const queryBuilder = this.patientBalanceRepo
      .createQueryBuilder('patientBalance')
      .innerJoinAndSelect('patientBalance.patient', 'patient')
      .leftJoinAndSelect('patient.phones', 'phone')
      .andWhere('patientBalance.usrId = :user', { user: user.id })
      .andWhere('patientBalance.amount < 0');

    for (let i = 0; i < param.filterParam?.length; i++) {
      switch (param.filterParam?.[i]) {
        case 'patientBalance.amount':
          queryBuilder.andWhere('patientBalance.amount <= :amount', {
            amount: param.filterValue?.[i],
          });
          break;
        case 'patientBalance.visitDate':
          const arrDate = param.filterValue?.[i].toString().split(';');
          if (arrDate.length > 0 && arrDate?.[0]) {
            queryBuilder.andWhere('patientBalance.visitDate >= :startDate', {
              startDate: arrDate?.[0],
            });
          }
          if (arrDate.length > 1 && arrDate?.[1]) {
            queryBuilder.andWhere('patientBalance.visitDate <= :endDate', {
              endDate: arrDate?.[1],
            });
          }
          break;
      }
    }

    if (param?.sort)
      queryBuilder.addOrderBy(
        unpaidSort[param?.sort],
        param?.direction.toLocaleLowerCase() === 'asc' ? 'ASC' : 'DESC',
      );

    const res = await queryBuilder.getMany();

    const totalAmount = res.reduce(
      (totalAmount, item) => totalAmount + Number(item.amount),
      0,
    );

    const currencyObj = await this.userPreferenceRepo.findOneOrFail({
      select: ['currency'],
      where: {
        usrId: user.id,
      },
    });
    const data = {
      patientBalances: res,
      currency: currencyObj?.currency,
      totalAmount,
    };

    const templates = fs.readFileSync(
      path.join(__dirname, '../../../templates/credit-balances/index.hbs'),
      'utf-8',
    );

    Handlebars.registerHelper('dateShort', function (date) {
      return date ? dayjs(date).format('DD/MM/YYYY') : '';
    });

    return Handlebars.compile(templates)(data);
  }

  /**
   *php/user/credit-balances/export.php 100%
   */
  async exportCreditBalances(param: printUnpaidDto, res: Response) {
    const user = await this.userRepository.findOne({
      where: { id: param?.id },
    });
    if (!user) {
      throw new CNotFoundRequestException(ErrorCode.NOT_FOUND_USER);
    }
    try {
      const queryBuilder = this.patientBalanceRepo
        .createQueryBuilder('patientBalance')
        .innerJoinAndSelect('patientBalance.patient', 'patient')
        .leftJoinAndSelect('patient.phones', 'phone')
        .andWhere('patientBalance.usrId = :user', { user: user.id })
        .andWhere('patientBalance.amount < 0');

      for (let i = 0; i < param.filterParam?.length; i++) {
        switch (param.filterParam?.[i]) {
          case 'patientBalance.amount':
            queryBuilder.andWhere('patientBalance.amount <= :amount', {
              amount: param.filterValue?.[i],
            });
            break;
          case 'patientBalance.visitDate':
            const arrDate = param.filterValue?.[i].toString().split(';');
            if (arrDate.length > 0 && arrDate?.[0]) {
              queryBuilder.andWhere('patientBalance.visitDate >= :startDate', {
                startDate: arrDate?.[0],
              });
            }
            if (arrDate.length > 1 && arrDate?.[1]) {
              queryBuilder.andWhere('patientBalance.visitDate <= :endDate', {
                endDate: arrDate?.[1],
              });
            }
            break;
        }
      }

      if (param?.sort)
        queryBuilder.addOrderBy(
          unpaidSort[param?.sort],
          param?.direction.toLocaleLowerCase() === 'asc' ? 'ASC' : 'DESC',
        );

      const patientBalances = await queryBuilder.getMany();
      const rows = [];
      for (const patientBalance of patientBalances) {
        rows.push({
          dateVisite: patientBalance?.lastCare ? patientBalance.lastCare : '',
          patient:
            patientBalance.patient?.lastname +
            ' ' +
            patientBalance.patient?.firstname,
          telephone: patientBalance.patient?.phones
            ?.map((phone) => {
              return phone.nbr;
            })
            .join(' '),
          amount: patientBalance.amount,
        });
      }
      const fields = [
        { label: 'Date visite', value: 'dateVisite' },
        { label: 'Patient', value: 'patient' },
        { label: 'Téléphone', value: 'telephone' },
        { label: 'Solde', value: 'amount' },
      ];
      const parser = new Parser({ fields });
      const data = parser.parse(rows);
      res.header('Content-Type', 'text/csv');
      res.attachment('dossierscrediteurs.csv');
      res.status(200).send(data);
    } catch (err) {
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * File : php/user/credit-balances/index.php 100%
   * @param payload
   * @returns
   */
  async getPatientBalances(
    payload: CreditBalancesDto,
  ): Promise<IPatientBalances> {
    const { id, page, per_page, direction, sort } = payload;

    const filterParams: string[] = Array.isArray(payload?.filterParams)
      ? payload?.filterParams
      : [payload?.filterParams] || [];
    const filterValues: string[] = Array.isArray(payload?.filterValues)
      ? payload?.filterValues
      : [payload?.filterValues] || [];
    try {
      const user: UserEntity = await this.userRepository.findOne({
        where: { id: id },
      });

      if (!user) {
        throw new CBadRequestException(ErrorCode.NOT_FOUND_DOCTOR);
      }

      const queryBuilder: SelectQueryBuilder<ContactUserEntity> =
        this.patientBalanceRepo.createQueryBuilder('patientBalance');
      queryBuilder.leftJoinAndSelect('patientBalance.patient', 'patient');
      queryBuilder.where('patientBalance.usr_id = :usr_id', { usr_id: id });
      queryBuilder.andWhere('patientBalance.amount < 0');

      filterParams.map((filterParam, index) => {
        const filterValue = filterValues[index];
        switch (filterParam) {
          case 'patientBalance.amount':
            queryBuilder.andWhere('patientBalance.amount <= :amount', {
              amount: filterValue,
            });
            break;
          case 'patientBalance.visitDate':
            const period = filterValue.split(';');
            if (period[0]) {
              queryBuilder.andWhere('patientBalance.lastCare >= :visitDate1', {
                visitDate1: period[0],
              });
            }
            if (period[1]) {
              queryBuilder.andWhere('patientBalance.lastCare <= :visitDate2', {
                visitDate2: period[1],
              });
            }
            break;
          default:
            break;
        }
      });
      const pagination: ContactUserEntity[] = await queryBuilder
        .select()
        .getMany();

      const offSet = (page - 1) * per_page;
      const dataPaging: ContactUserEntity[] = pagination.slice(
        offSet,
        offSet + per_page,
      );
      const data: IPatientBalances = {
        current_page_number: page,
        custom_parameters: {
          query: {
            id: id,
            page: page,
            per_page: per_page,
            direction: direction,
            sort: sort,
          },
        },
        items: dataPaging,
        num_item_per_page: per_page,
        paginator_options: {
          pageParameterName: 'page',
          sortFieldParameterName: 'sort',
          sortDirectionParameterName: 'direction',
          filterFieldParameterName: 'filterParam',
          filterValueParameterName: 'filterValue',
          distinct: false,
          defaultSortFieldName: 'patientBalance.visitDate',
          defaultSortDirection: 'desc',
        },
        range: 5,
        total_count: dataPaging?.length,
      };

      return data;
    } catch (e) {
      throw new CBadRequestException(ErrorCode.QUERY_REPOSITORY_ERROR);
    }
  }
}
