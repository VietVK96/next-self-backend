import { Injectable } from '@nestjs/common';
import { UserEntity } from 'src/entities/user.entity';
import {
  And,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UnpaidDto, printUnpaidDto } from '../dto/unpaid.dto';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { unpaidSort } from 'src/constants/unpaid';
import { PatientMedicalEntity } from 'src/entities/patient-medical.entity';
import { format } from 'date-fns';
import { Parser } from 'json2csv';
import { Response } from 'express';
import { ErrorCode } from 'src/constants/error';
import * as dayjs from 'dayjs';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { LettersEntity } from 'src/entities/letters.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { DocumentMailService } from 'src/mail/services/document.mail.service';
import { TranformVariableParam } from 'src/mail/dto/transformVariable.dto';
import { CONFIGURATION } from 'src/constants/configuration';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';
import * as path from 'path';
import { PdfTemplateFile, customCreatePdf } from 'src/common/util/pdf';
import { checkId } from 'src/common/util/number';

@Injectable()
export class UnpaidService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(ContactUserEntity)
    private patientBalanceRepo: Repository<ContactUserEntity>,
    @InjectRepository(UserPreferenceEntity)
    private userPreferenceRepo: Repository<UserPreferenceEntity>,
    @InjectRepository(LettersEntity)
    private mailRepo: Repository<LettersEntity>,
    @InjectRepository(ContactNoteEntity)
    private contactNoteRepo: Repository<ContactNoteEntity>,
    private documentMailService: DocumentMailService,
  ) {}

  async getUserUnpaid(payload: UnpaidDto) {
    const { page, per_page } = payload;
    const filterParam: string[] = Array.isArray(payload?.filterParam)
      ? payload?.filterParam
      : [payload?.filterParam] || [];
    const filterValue: string[] = Array.isArray(payload?.filterValue)
      ? payload?.filterValue
      : [payload?.filterValue] || [];
    const user = await this.userRepository.findOne({
      where: { id: payload?.id },
    });
    if (!user) {
      throw new CNotFoundRequestException(ErrorCode.NOT_FOUND_USER);
    }
    let amount = 0;
    const where:
      | FindOptionsWhere<ContactUserEntity>
      | FindOptionsWhere<ContactUserEntity>[] = {};
    const skip = page ? (page - 1) * per_page : 0;

    filterParam.forEach((param, index) => {
      const valueParam = filterValue[index];
      switch (param) {
        case 'patientBalance.amount':
          amount = valueParam ? Number(valueParam) : 0;
          break;
        case 'patientBalance.relaunchLevel':
          where.relaunchLevel = valueParam
            ? MoreThanOrEqual(Number(valueParam))
            : 0;
          break;
        case 'patientBalance.visitDate':
          const period = valueParam.split(';');
          where.lastCare = And(
            MoreThanOrEqual(period[0]),
            LessThanOrEqual(period[1]),
          );
          break;
      }
    });

    where.usrId = user?.id;
    where.amount = amount ? MoreThanOrEqual(amount) : MoreThan(0);

    const balance = await this.patientBalanceRepo.find({
      where,
      relations: {
        patient: {
          phones: true,
          address: true,
          civilityTitle: true,
          medical: true,
          user: {
            amo: true,
            medical: {
              specialtyCode: true,
            },
          },
        },
      },
      order: {
        lastCare:
          payload?.direction?.toLocaleLowerCase() === 'asc' ? 'ASC' : 'DESC',
      },
      take: per_page ? per_page : null,
      skip,
    });
    const count = await this.patientBalanceRepo.count({ where });
    return { balance, count, user };
  }

  /**
   * File php/user/unpaid/index.php
   * Line 20 -> 90
   */

  async getUserUnpaidPatient(payload: UnpaidDto) {
    const { page, per_page } = payload;
    const { balance, count } = await this.getUserUnpaid(payload);
    const data = {
      current_page_number: page,
      custom_parameters: { query: payload },
      items: balance,
      num_item_per_page: per_page,
      paginator_options: {
        defaultSortDirection: 'desc',
        defaultSortFieldName: 'patientBalance.visitDate',
        distinct: false,
        filterFieldParameterName: 'filterParam',
        filterValueParameterName: 'filterValue',
        pageParameterName: 'page',
        sortDirectionParameterName: 'direction',
        sortFieldParameterName: 'sort',
      },
      range: 5,
      total_count: count,
    };
    return data;
  }

  /**
   * File php/user/unpaid/export.php
   * Line 14 -> 115
   */

  async getExportQuery(res: Response, payload: UnpaidDto) {
    const { balance: patientBalances } = await this.getUserUnpaid(payload);

    const rows = patientBalances.map((e) => {
      const phoneNumber = e?.patient?.phones
        ? e?.patient?.phones?.reduce((numbers, phone, i) => {
            numbers = i === 0 ? phone.nbr : numbers + ' ' + phone.nbr;
            return numbers;
          }, '')
        : '';
      return {
        lastCare: e?.lastCare
          ? format(new Date(e?.lastCare), 'dd/MM/yyyy')
          : '',
        name: `${e.patient?.lastname ?? ''} ${e.patient?.firstname ?? ''}`,
        phoneNumber,
        amount: e?.amount ? parseFloat(e?.amount.toString()) : 0,
        relaunchLevel: e?.relaunchLevel
          ? parseFloat(e?.relaunchLevel.toString())
          : 0,
        relaunchDate: e?.relaunchDate
          ? format(new Date(e?.relaunchDate), 'dd/MM/yyyy')
          : '',
      };
    });
    const fields = [
      { label: 'Date visite', value: 'lastCare' },
      { label: 'Patient', value: 'name' },
      { label: 'Téléphone', value: 'phoneNumber' },
      { label: 'Solde', value: 'amount' },
      { label: 'Niveau', value: 'relaunchLevel' },
      { label: 'Date relance', value: 'relaunchDate' },
    ];
    const parser = new Parser({ fields });
    const data = parser.parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment(`impayes_${format(new Date(), 'yyyyMMdd')}.csv`);
    res.status(200).send(data);
  }

  _isActiveActPatientMedical(medical: PatientMedicalEntity) {
    const now = new Date();
    return (
      ['11', '12', '13', '14'].includes(medical?.serviceAmoCode) &&
      (!medical?.serviceAmoStartDate ||
        now.getTime() >= new Date(medical?.serviceAmoStartDate).getTime()) &&
      (!medical?.serviceAmoEndDate ||
        now.getTime() <= new Date(medical?.serviceAmoEndDate).getTime())
    );
  }

  /**
   * File php/user/unpaid/print.php 100%
   *
   */
  async printUnpaid(param?: printUnpaidDto) {
    delete param?.page;
    delete param?.per_page;
    try {
      const {
        balance: userUnpaid,
        count,
        user,
      } = await this.getUserUnpaid(param as UnpaidDto);

      const totalAmount = userUnpaid.reduce(
        (totalAmount, item) => totalAmount + Number(item.amount),
        0,
      );

      const currencyObj = await this.userPreferenceRepo.findOneOrFail({
        select: ['currency'],
        where: {
          usrId: checkId(param?.id),
        },
      });

      const filePath = path.join(
        process.cwd(),
        'templates/unpaid',
        'index.hbs',
      );

      const files: PdfTemplateFile[] = [];
      const pageCount = Math.ceil(count / 31);
      for (let i = 0; i < pageCount; i++) {
        files.push({
          data: {
            patientBalances: userUnpaid.splice(0, 31),
            currency: currencyObj?.currency,
            totalAmount,
            displayFooter: i === pageCount - 1,
          },
          path: filePath,
        });
      }

      return await customCreatePdf({
        files,
        options: {
          displayHeaderFooter: true,
          headerTemplate: `<div style="width: 100%;margin: 0 5mm;font-size: 8px; display:flex; justify-content:space-between"><div>${user.lastname} ${user.firstname}</div> <div>Impays</div></div>`,
          footerTemplate: `<div style="width: 100%;margin-right:10mm; text-align: right; font-size: 8px;"><span class="pageNumber"></span>/<span class="totalPages"></span></div>`,
          margin: {
            left: '5mm',
            top: '10mm',
            right: '5mm',
            bottom: '10mm',
          },
        },
        helpers: {
          dateShort: function (date) {
            return date ? dayjs(date).format('DD/MM/YYYY') : '';
          },
        },
      });
    } catch (e) {
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * File php/user/unpaid/relaunch.php 100%
   *
   */
  async relaunchUnpaid(param: printUnpaidDto) {
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
      .andWhere('patientBalance.amount > 0');
    for (let i = 0; i < param.filterParam?.length; i++) {
      switch (param.filterParam?.[i]) {
        case 'patientBalance.id':
          const formatIds = Array.isArray(param?.filterValue[i])
            ? (param?.filterValue[i] as string[]).join(',')
            : [];

          queryBuilder.andWhere(`patientBalance.id IN (${formatIds})`);
          break;
        case 'patientBalance.amount':
          queryBuilder.andWhere('patientBalance.amount >= :amount', {
            amount: param?.filterValue[i],
          });
          break;
        case 'patientBalance.relaunchLevel':
          queryBuilder.andWhere(
            'patientBalance.relaunchLevel >= :relaunchLevel',
            {
              relaunchLevel: param.filterValue?.[i],
            },
          );
          break;
        case 'patientBalance.visitDate':
          const arrDate = param.filterValue?.[i]?.toString().split(';');
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

    const responses: any = [];

    for (const patientBalance of patientBalances) {
      const updatePatientBalance = {
        ...patientBalance,
        relaunchLevel: patientBalance.relaunchLevel + 1,
        relaunchDate: dayjs(new Date()).format('YYYY/MM/DD'),
      };

      const mailName =
        CONFIGURATION.setting.MAIL_UNPAID_NAME +
        ' ' +
        updatePatientBalance.relaunchLevel;

      try {
        const qr = await this.mailRepo
          .createQueryBuilder('mail')
          .select('mail.msg')
          .leftJoin('mail.user', 'user')
          .andWhere('mail.title = :title', { title: mailName })
          .andWhere('mail.patient IS NULL')
          .andWhere('(mail.user IS NULL OR mail.usrId = :user)', {
            user: user.id,
          })
          .addOrderBy('user.id', 'DESC')
          .getOne();

        const message = !qr
          ? `Impossible d'imprimer le courrier ${mailName} pour le patient ${
              patientBalance.patient.lastname +
              ' ' +
              patientBalance.patient.firstname
            }.`
          : qr.msg;
        const mailParam: TranformVariableParam = {
          message: message,
          groupId: user.organizationId,
          practitionerId: user.id,
          patientId: patientBalance.patient.id,
        };

        const response = await this.documentMailService.transformVariable(
          mailParam,
        );
        responses.push(
          '<div style="page-break-after: always;">' + response + '</div>',
        );

        if (qr) {
          const patientNode = new ContactNoteEntity();
          patientNode.userId = user.id;
          patientNode.conId = patientBalance.patient.id;
          patientNode.date = dayjs(new Date()).format('YYYY-MM-DD');
          patientNode.message = `Impossible d'imprimer le courrier ${mailName} pour le patient {${
            patientBalance.patient.lastname +
            ' ' +
            patientBalance.patient.firstname
          }}`;
          await this.patientBalanceRepo.save(updatePatientBalance);
          await this.contactNoteRepo.save(patientNode);
        }
      } catch (err) {
        throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
      }
    }
    return responses;
  }
}
