import { Injectable } from '@nestjs/common';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UnpaidDto, printUnpaidDto } from '../dto/unpaid.dto';
import { ContactEntity } from 'src/entities/contact.entity';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { unpaidSort } from 'src/constants/unpaid';
import { PatientMedicalEntity } from 'src/entities/patient-medical.entity';
import { format } from 'date-fns';
import { Parser } from 'json2csv';
import { Response } from 'express';
import { ErrorCode } from 'src/constants/error';
import { customCreatePdf } from 'src/common/util/pdf';
import * as path from 'path';
import * as dayjs from 'dayjs';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { LettersEntity } from 'src/entities/letters.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { DocumentMailService } from 'src/mail/services/document.mail.service';
import { TranformVariableParam } from 'src/mail/dto/transformVariable.dto';
import { CONFIGURATION } from 'src/constants/configuration';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class UnpaidService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(ContactEntity)
    private patientRepository: Repository<ContactEntity>,
    @InjectRepository(ContactUserEntity)
    private patientBalanceRepo: Repository<ContactUserEntity>,
    @InjectRepository(UserPreferenceEntity)
    private userPreferenceRepo: Repository<UserPreferenceEntity>,
    @InjectRepository(LettersEntity)
    private mailRepo: Repository<LettersEntity>,
    @InjectRepository(ContactNoteEntity)
    private contactNoteRepo: Repository<ContactNoteEntity>,
    private documentMailService: DocumentMailService,
    private configService: ConfigService,
  ) {}

  async getUserUnpaid(payload: UnpaidDto) {
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
    const queryBuilder = this.dataSource
      .createQueryBuilder()
      .select(
        `
      patientBalance.amount as amount,
      patientBalance.amountCare as amountCare,
      patientBalance.amountProsthesis as amountProsthesis,
      patientBalance.id as id,
      patientBalance.relaunchDate as relaunchDate,
      patientBalance.relaunchLevel as relaunchLevel,
      patientBalance.lastCare as lastCare,
      patientBalance.conId as conId
      `,
      )
      .from(ContactUserEntity, 'patientBalance')
      .innerJoin(ContactEntity, 'patient', 'patientBalance.conId = patient.id')
      .andWhere('patientBalance.usrId = :usrId', { usrId: user.id })
      .andWhere('patientBalance.amount > 0');

    filterParam.forEach((param, index) => {
      const valueParam = filterValue[index];
      switch (param) {
        case 'patientBalance.amount':
          queryBuilder.andWhere('patientBalance.amount >= :amount', {
            amount: valueParam,
          });
          break;
        case 'patientBalance.relaunchLevel':
          queryBuilder.andWhere(
            'patientBalance.relaunchLevel >= :relaunchLevel',
            {
              relaunchLevel: valueParam,
            },
          );
          break;
        case 'patientBalance.visitDate':
          const period = valueParam.split(';');
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
      }
    });
    const sort = payload?.sort ?? 'patientBalance.visitDate';
    queryBuilder.addOrderBy(
      unpaidSort[sort],
      payload?.direction?.toLocaleLowerCase() === 'asc' ? 'ASC' : 'DESC',
    );
    const queryResult: ContactUserEntity[] = await queryBuilder.getRawMany();
    return queryResult;
  }

  /**
   * File php/user/unpaid/index.php
   * Line 20 -> 90
   */

  async getUserUnpaidPatient(payload: UnpaidDto) {
    const { page, per_page } = payload;
    const patientBalances: ContactUserEntity[] = await this.getUserUnpaid(
      payload,
    );
    const patients = await this.patientRepository.find({
      select: ['id', 'birthOrder', 'email', 'firstname', 'lastname', 'nbr'],
      relations: [
        'address',
        'civilityTitle',
        'medical',
        'user',
        'user.amo',
        'user.medical',
        'user.medical.specialtyCode',
      ],
    });
    const patientBalancesFormat = patientBalances.map((patientBalance) => {
      const patient = patients.find((p) => p?.id === patientBalance?.conId);
      const res: any = {
        id: patientBalance?.id,
        amount: patientBalance?.amount
          ? parseFloat(patientBalance?.amount.toString())
          : 0,
        amount_care: patientBalance?.amountCare
          ? parseFloat(patientBalance?.amountCare.toString())
          : 0,
        amount_prosthesis: patientBalance?.amountProsthesis
          ? parseFloat(patientBalance?.amountProsthesis.toString())
          : 0,
        relaunch_date: patientBalance?.relaunchDate
          ? format(new Date(patientBalance?.relaunchDate), 'yyyy-MM-dd')
          : '',
        relaunch_level: patientBalance?.relaunchLevel
          ? parseFloat(patientBalance?.relaunchLevel.toString())
          : 0,
        visit_date: patientBalance?.lastCare ?? '',
      };
      if (patient) {
        const patientRes: any = {
          id: patient?.id,
          birth_rank: patient?.birthOrder,
          email: patient?.email ?? '',
          first_name: patient?.firstname ?? '',
          last_name: patient?.lastname ?? '',
          full_name: `${patient?.lastname ?? ''} ${patient?.firstname ?? ''}`,
          number: patient?.nbr,
        };
        if (patient?.address) {
          patientRes.address = {
            id: patient?.address?.id,
            city: patient?.address?.city ?? '',
            country: patient?.address?.country ?? '',
            country_code: patient?.address?.countryAbbr ?? '',
            street: patient?.address?.street ?? '',
            street2: patient?.address?.streetComp ?? '',
            zip_code: patient?.address?.zipCode ?? '',
          };
        }
        if (patient?.civilityTitle) {
          patientRes.civility_title = {
            id: patient?.civilityTitle?.id,
            code: patient?.civilityTitle?.code,
            name: patient?.civilityTitle?.longName ?? '',
            short_name: patient?.civilityTitle?.name ?? '',
          };
        }
        if (patient?.medical) {
          const isActiveAcs = this._isActiveActPatientMedical(patient?.medical);
          patientRes.medical = {
            id: patient?.medical?.id,
            is_active_acs: isActiveAcs,
          };
        }
        if (patient?.user) {
          const user: any = {
            id: patient?.user?.id,
            admin: !!patient?.user?.admin,
            email: patient?.user?.email,
            first_name: patient?.user?.firstname,
            last_name: patient?.user?.lastname,
            full_name: `${patient?.user?.lastname ?? ''} ${
              patient?.user?.firstname ?? ''
            }`,
            home_phone_number: patient?.user?.phoneNumber,
            settings: patient?.user?.settings,
            short_name: patient?.user?.abbr,
          };
          if (patient?.user?.amo) {
            user.amo = {
              id: patient?.user?.amo?.id,
              code_convention: patient?.user?.amo?.codeConvention,
              id_tp: !!patient?.user?.amo?.isTp,
            };
          }
          if (patient?.user?.medical) {
            user.medical = {
              id: patient?.user?.medical?.id,
              finess_number: patient?.user?.medical?.finessNumber ?? '',
              national_identifier_number:
                patient?.user?.medical?.nationalIdentifierNumber ?? '',
              national_identifier_number_remp:
                patient?.user?.medical?.nationalIdentifierNumberRemp ?? '',
              rpps_number: patient?.user?.medical?.rppsNumber,
              specialty_code: patient?.user?.medical?.specialtyCode ?? null,
            };
          }
          user.setting = {};
          patientRes.user = user;
        }
        res.patient = patientRes;
      }
      return res;
    });
    const offSet = (page - 1) * per_page;
    const dataPaging = patientBalancesFormat.slice(offSet, offSet + per_page);
    const data = {
      current_page_number: page,
      custom_parameters: { query: payload },
      items: dataPaging,
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
      total_count: dataPaging?.length,
    };
    return data;
  }

  /**
   * File php/user/unpaid/export.php
   * Line 14 -> 115
   */

  async getExportQuery(res: Response, payload: UnpaidDto) {
    const patientBalances: ContactUserEntity[] = await this.getUserUnpaid(
      payload,
    );
    const patients = await this.patientRepository.find({
      relations: ['phones'],
    });
    const rows = [];
    for (const patientBalance of patientBalances) {
      const patient = patients.find((p) => p?.id === patientBalance?.conId);
      const listPhoneNumber = patient?.phones?.map((phone) => phone?.nbr) ?? [];
      const phoneNumber = listPhoneNumber ? listPhoneNumber?.join(' ') : '';
      rows.push({
        lastCare: patientBalance?.lastCare
          ? format(new Date(patientBalance?.lastCare), 'dd/MM/yyyy')
          : '',
        name: `${patient?.lastname ?? ''} ${patient?.firstname ?? ''}`,
        phoneNumber,
        amount: patientBalance?.amount
          ? parseFloat(patientBalance?.amount.toString())
          : 0,
        relaunchLevel: patientBalance?.relaunchLevel
          ? parseFloat(patientBalance?.relaunchLevel.toString())
          : 0,
        relaunchDate: patientBalance?.relaunchDate
          ? format(new Date(patientBalance?.relaunchDate), 'dd/MM/yyyy')
          : '',
      });
    }

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
          case 'patientBalance.relaunchLevel':
            queryBuilder.andWhere(
              'patientBalance.relaunchLevel >= :relaunchLevel',
              {
                relaunchLevel: param.filterValue?.[i],
              },
            );
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

      const filePath = path.join(
        process.cwd(),
        'templates/unpaid',
        'index.hbs',
      );

      const files = [{ path: filePath, data }];

      const options = {
        format: 'A4',
        displayHeaderFooter: true,
        // landscape: true,
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
        )}</span><span style="font-size: 8px;margin-right:40mm; float: right;">Impayés</span></div>`,
        footerTemplate: `
        <div style="width: 100%;margin-right:10mm; font-size: 8px; display: flex; justify-content: space-between">
          <span style="margin-left: 10mm">${this.configService.get(
            'app.host',
          )}/index#unpaid</span>
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
    } catch (e) {
      console.log('unpaid/print-services', e);
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
