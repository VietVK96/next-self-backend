import { Injectable } from '@nestjs/common';
import { printUnpaidDto } from '../dto/unpaid.dto';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import * as path from 'path';
import * as dayjs from 'dayjs';
import { unpaidSort } from 'src/constants/unpaid';
import { customCreatePdf } from 'src/common/util/pdf';
import { Repository } from 'typeorm';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { Parser } from 'json2csv';

@Injectable()
export class CreditBalancesService {
  constructor(
    @InjectRepository(ContactUserEntity)
    private patientBalanceRepo: Repository<ContactUserEntity>,
    @InjectRepository(UserPreferenceEntity)
    private userPreferenceRepo: Repository<UserPreferenceEntity>,
  ) {}

  /**
   *php/user/credit-balances/print.php 100%
   */
  async printCreditBalances(param: printUnpaidDto, identity: UserIdentity) {
    const queryBuilder = this.patientBalanceRepo
      .createQueryBuilder('patientBalance')
      .innerJoinAndSelect('patientBalance.patient', 'patient')
      .leftJoinAndSelect('patient.phones', 'phone')
      .andWhere('patientBalance.usrId = :user', { user: identity.id })
      .andWhere('patientBalance.amount >= 0');

    for (let i = 0; i < param.filterParam?.length; i++) {
      switch (param.filterParam?.[i]) {
        case 'patientBalance.amount':
          queryBuilder.andWhere('patientBalance.amount >= :amount', {
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
        usrId: identity.id,
      },
    });
    const data = {
      patientBalances: res,
      currency: currencyObj?.currency,
      totalAmount,
    };

    const filePath = path.join(
      process.cwd(),
      'templates/credit-balances',
      'index.hbs',
    );

    const files = [{ path: filePath, data }];

    const options = {
      format: 'A4',
      displayHeaderFooter: true,
      landscape: true,
      margin: {
        left: '10mm',
        top: '20mm',
        right: '10mm',
        bottom: '20mm',
      },

      headerTemplate: `<div style="width:100%;margin-left:10mm"><span style="font-size: 8px;">${dayjs(
        new Date(),
      ).format(
        'M/D/YY, hh:mm A',
      )}</span><span style="font-size: 8px;margin-right:40mm; float: right;">Dossiers créditeurs</span></div>`,
      footerTemplate: `
        <div style="width: 100%;margin-right:10mm; font-size: 8px; display: flex; justify-content: space-between">
          <span style="margin-left: 10mm">${process.env.HOST}/index#credit-balances</span>
          <div>
            <span class="pageNumber"></span>
            <span>/</span>
            <span class="totalPages"></span>
          </div>
        </div>
      `,
    };

    const helpers = {
      dateShort: (date) => (date ? dayjs(date).format('DD/MM/YYYY') : ''),
    };

    return await customCreatePdf({ files, options, helpers });
  }

  /**
   *php/user/credit-balances/export.php 100%
   */
  async exportCreditBalances(
    param: printUnpaidDto,
    identity: UserIdentity,
    res: Response,
  ) {
    try {
      const queryBuilder = this.patientBalanceRepo
        .createQueryBuilder('patientBalance')
        .innerJoinAndSelect('patientBalance.patient', 'patient')
        .leftJoinAndSelect('patient.phones', 'phone')
        .andWhere('patientBalance.usrId = :user', { user: identity.id })
        .andWhere('patientBalance.amount >= 0');

      for (let i = 0; i < param.filterParam?.length; i++) {
        switch (param.filterParam?.[i]) {
          case 'patientBalance.amount':
            queryBuilder.andWhere('patientBalance.amount >= :amount', {
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
}
