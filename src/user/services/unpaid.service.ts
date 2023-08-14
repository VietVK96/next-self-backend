import { Injectable } from '@nestjs/common';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UnpaidDto } from '../dto/unpaid.dto';
import { ContactEntity } from 'src/entities/contact.entity';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { unpaidSort } from 'src/constants/unpaid';
import { PatientMedicalEntity } from 'src/entities/patient-medical.entity';
import { format } from 'date-fns';
import { Parser } from 'json2csv';
import { Response } from 'express';
import { ErrorCode } from 'src/constants/error';
@Injectable()
export class UnpaidService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(ContactEntity)
    private patientRepository: Repository<ContactEntity>,
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
}
