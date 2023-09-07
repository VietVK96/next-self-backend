import { ContactEntity } from 'src/entities/contact.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { ThirdPartyDto, ThirdPartyUpdateDto } from './dto/index.dto';
import { UserEntity } from 'src/entities/user.entity';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import {
  EnumThirdPartyStatus,
  ThirdPartyAmcEntity,
} from 'src/entities/third-party-amc.entity';
import { ThirdPartyAmoEntity } from 'src/entities/third-party-amo.entity';
import { AmoEntity } from 'src/entities/amo.entity';
import { AmcEntity } from 'src/entities/amc.entity';
import { FseEntity } from 'src/entities/fse.entity';
import { UserThirdPartyRes } from './response/index.res';
import { format } from 'date-fns';
import { thirdPartySort } from 'src/constants/third-party';
import { Parser } from 'json2csv';
import { Response } from 'express';
import { ThirdPartyStatusEnum } from 'src/enum/third-party-status.enum';
import { LibraryBankEntity } from 'src/entities/library-bank.entity';
import {
  CashingEntity,
  EnumCashingPayment,
  EnumCashingType,
} from 'src/entities/cashing.entity';
import { CashingContactEntity } from 'src/entities/cashing-contact.entity';
import { ActsService } from 'src/caresheets/service/caresheets.service';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { customCreatePdf } from 'src/common/util/pdf';
import * as path from 'path';
import * as dayjs from 'dayjs';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from 'src/constants/error';
import Handlebars from 'handlebars';

@Injectable()
export class ThirdPartyService {
  constructor(
    private dataSource: DataSource,
    private actsService: ActsService,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(ContactEntity)
    private patientRepository: Repository<ContactEntity>,
    @InjectRepository(ThirdPartyAmcEntity)
    private thirdPartyAmcRepository: Repository<ThirdPartyAmcEntity>,
    @InjectRepository(ThirdPartyAmoEntity)
    private thirdPartyAmoRepository: Repository<ThirdPartyAmoEntity>,
    @InjectRepository(AmoEntity)
    private amoRepository: Repository<AmoEntity>,
    @InjectRepository(AmcEntity)
    private amcRepository: Repository<AmcEntity>,
    @InjectRepository(FseEntity)
    private fseRepository: Repository<FseEntity>,
    @InjectRepository(LibraryBankEntity)
    private libraryBankRepository: Repository<LibraryBankEntity>,
    @InjectRepository(CashingContactEntity)
    private cashingContactRepository: Repository<CashingContactEntity>,
    @InjectRepository(CashingEntity)
    private cashingRepository: Repository<CashingEntity>,
    @InjectRepository(UserPreferenceEntity)
    private userPreferenceRepo: Repository<UserPreferenceEntity>,
    private configService: ConfigService,
  ) {}

  async getCaresheet(payload: ThirdPartyDto) {
    const { user_id, direction } = payload;
    const filterParam: string[] = Array.isArray(payload?.filterParam)
      ? payload?.filterParam
      : [payload?.filterParam] || [];
    const filterValue: string[] = Array.isArray(payload?.filterValue)
      ? payload?.filterValue
      : [payload?.filterValue] || [];
    const user = await this.userRepository.findOne({ where: { id: user_id } });
    if (!user) {
      throw new CNotFoundRequestException('User Not Found');
    }
    const queryBuilder = this.dataSource
      .createQueryBuilder()
      .select(
        `
    caresheet.id as id,
    caresheet.conId as conId,
    caresheet.tiersPayantStatus as tiersPayantStatus,
    caresheet.amount as amount,
    caresheet.thirdPartyAmount as thirdPartyAmount,
    caresheet.thirdPartyAmountPaid as thirdPartyAmountPaid,
    caresheet.date as date,
    caresheet.nbr as nbr
    `,
      )
      .from(FseEntity, 'caresheet')
      .innerJoin(ContactEntity, 'patient', 'caresheet.conId = patient.id')
      .andWhere('caresheet.usrId = :usrId', { usrId: user.id })
      .andWhere('caresheet.tiersPayant = true');

    filterParam.forEach((param, index) => {
      const valueParam = filterValue[index];
      switch (param) {
        case 'caresheet.creationDate':
          queryBuilder.andWhere('caresheet.FSE_DATE = :creationDate', {
            creationDate: valueParam,
          });
          break;
        case 'caresheet.number':
          queryBuilder.andWhere('caresheet.nbr = LPAD(:number, 9, 0)', {
            number: valueParam,
          });
          break;
        case 'caresheet.tiersPayantStatus':
          queryBuilder.andWhere(
            'caresheet.tiersPayantStatus = :tiersPayantStatus',
            { tiersPayantStatus: valueParam },
          );
          break;
        case 'amo.libelle':
          queryBuilder.innerJoin(
            ThirdPartyAmoEntity,
            'thirdPartyAmo',
            'thirdPartyAmo.caresheetId = caresheet.id',
          );
          queryBuilder.innerJoin(
            AmoEntity,
            'amo',
            'thirdPartyAmo.amoId = amo.id',
          );
          queryBuilder.andWhere('amo.libelle LIKE :amoLibelle', {
            amoLibelle: `${valueParam}%`,
          });
          break;
        case 'amc.libelle':
          queryBuilder.innerJoin(
            ThirdPartyAmcEntity,
            'thirdPartyAmc',
            'thirdPartyAmc.caresheetId = caresheet.id',
          );
          queryBuilder.innerJoin(
            AmcEntity,
            'amc',
            'thirdPartyAmc.amcId = amc.id',
          );
          queryBuilder.andWhere('amc.libelle LIKE :amcLibelle', {
            amcLibelle: `${valueParam}%`,
          });
          break;
      }
    });
    const sortList = payload?.sort?.split('+') ?? [];
    for (const sortItem of sortList) {
      const sort = thirdPartySort[sortItem];
      queryBuilder.addOrderBy(
        sort,
        direction?.toLocaleLowerCase() === 'asc' ? 'ASC' : 'DESC',
      );
    }
    const queryResult: FseEntity[] = await queryBuilder.getRawMany();

    return queryResult;
  }

  /**
   * File: php/third-party/index.php
   * Line: 18 -> 108
   */
  async getPatientThirdParty(payload: ThirdPartyDto) {
    const { user_id, page, per_page } = payload;
    const user = await this.userRepository.findOne({ where: { id: user_id } });
    if (!user) {
      throw new CNotFoundRequestException('User Not Found');
    }
    const patients = await this.patientRepository.find({
      select: ['id', 'lastname', 'firstname'],
    });
    const thirdPartyAmcs = await this.thirdPartyAmcRepository.find({
      select: ['id', 'status', 'caresheetId', 'amcId'],
    });
    const amcs = await this.amcRepository.find({
      select: ['id', 'libelle', 'numero'],
    });
    const thirdPartyAmos = await this.thirdPartyAmoRepository.find({
      select: ['id', 'status', 'caresheetId', 'amoId'],
    });
    const amos = await this.amoRepository.find({
      select: ['id', 'libelle', 'codeNational'],
    });

    const caresheets: FseEntity[] = await this.getCaresheet(payload);
    const patientThirdParties = caresheets.map((item: FseEntity) => {
      const res: UserThirdPartyRes = {
        id: item?.id,
        amount: item?.amount,
        creation_date: item?.date
          ? format(new Date(item?.date), 'yyyy-MM-dd')
          : '',
        third_party_amount: item?.thirdPartyAmount,
        third_party_amount_paid: item?.thirdPartyAmountPaid,
        tiers_payant_status: item?.tiersPayantStatus,
        number: item?.nbr,
      };
      const patientRes = patients.find((p) => p?.id === item?.conId);
      if (patientRes) {
        res.patient = {
          id: patientRes?.id,
          full_name: `${patientRes?.lastname} ${patientRes?.firstname}`,
        };
      }
      const thirdPartyAmc = thirdPartyAmcs.find(
        (tpamc) => tpamc?.caresheetId === item?.id,
      );
      if (thirdPartyAmc && thirdPartyAmc?.amcId) {
        const amc = amcs.find((a) => a?.id === thirdPartyAmc?.amcId);
        res.third_party_amc = {
          id: thirdPartyAmc?.id,
          status: thirdPartyAmc?.status,
          amc,
        };
      }
      const thirdPartyAmo = thirdPartyAmos.find(
        (tpamo) => tpamo?.caresheetId === item?.id,
      );
      if (thirdPartyAmo && thirdPartyAmo?.amoId) {
        const amo = amos.find((a) => a?.id === thirdPartyAmo?.amoId);
        res.third_party_amo = {
          id: thirdPartyAmo?.id,
          status: thirdPartyAmo?.status,
          amo: {
            id: amo?.id,
            libelle: amo?.libelle,
            code_national: amo?.codeNational,
          },
        };
      }
      return res;
    });
    const offSet = page && per_page ? (page - 1) * per_page : 0;
    const dataPaging =
      page && per_page
        ? patientThirdParties.slice(offSet, offSet + per_page)
        : patientThirdParties;
    const data = {
      current_page_number: page,
      custom_parameters: { sorted: true },
      items: dataPaging,
      num_item_per_page: per_page,
      paginator_options: {
        defaultSortDirection: 'desc',
        defaultSortFieldName: 'caresheet.creationDate+caresheet.number',
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
   * File: php/third-party/export.php
   * Line: 18 -> 125
   */
  async getExportQuery(res: Response, payload: ThirdPartyDto) {
    const caresheets: FseEntity[] = await this.getCaresheet(payload);
    const user = await this.userRepository.findOne({
      where: { id: payload?.user_id },
    });
    if (!user) {
      throw new CNotFoundRequestException('User Not Found');
    }
    const patients = await this.patientRepository.find({
      select: ['id', 'lastname', 'firstname'],
    });
    const thirdPartyAmcs = await this.thirdPartyAmcRepository.find({
      select: ['id', 'status', 'caresheetId', 'amcId'],
      relations: ['amc'],
    });
    const thirdPartyAmos = await this.thirdPartyAmoRepository.find({
      select: ['id', 'status', 'caresheetId', 'amoId'],
      relations: ['amo'],
    });

    const rows = [];
    for (const caresheet of caresheets) {
      const thirdPartyAmo = thirdPartyAmos.find(
        (tpamo) => tpamo?.caresheetId === caresheet?.id,
      );
      const thirdPartyAmc = thirdPartyAmcs.find(
        (tpamc) => tpamc?.caresheetId === caresheet?.id,
      );
      const patient = patients.find((p) => p?.id === caresheet?.conId);
      rows.push({
        amoStatus: ThirdPartyStatusEnum.choices[thirdPartyAmo?.status] ?? null,
        amcStatus: ThirdPartyStatusEnum.choices[thirdPartyAmc?.status] ?? null,
        date: caresheet?.date
          ? format(new Date(caresheet?.date), 'dd/MM/yyyy')
          : '',
        number: caresheet?.nbr ?? '',
        patient: `${patient?.lastname ?? ''} ${patient?.firstname ?? ''}`,
        amo: thirdPartyAmo?.amo?.libelle ?? null,
        amc: thirdPartyAmc?.amc?.libelle ?? null,
        amount: caresheet?.thirdPartyAmount ?? null,
        amountPaid: caresheet?.thirdPartyAmountPaid ?? null,
        amountRemaining:
          caresheet?.thirdPartyAmount - caresheet?.thirdPartyAmountPaid ?? null,
      });
    }

    const fields = [
      { label: 'État AMO', value: 'amoStatus' },
      { label: 'État AMC', value: 'amcStatus' },
      { label: 'Date', value: 'date' },
      { label: 'Numéro', value: 'number' },
      { label: 'Patient', value: 'patient' },
      { label: 'Amo', value: 'amo' },
      { label: 'Amc', value: 'amc' },
      { label: 'Montant', value: 'amount' },
      { label: 'Montant payé', value: 'amountPaid' },
      { label: 'Montant restant', value: 'amountRemaining' },
    ];
    const parser = new Parser({ fields });
    const data = parser.parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('suivi_tiers_payants.csv');
    res.status(200).send(data);
  }

  /**
   * File: php/third-party/update.php
   * Line: 18 -> 164
   */
  async updateCaresheet(id: number, payload: ThirdPartyUpdateDto) {
    const caresheet = await this.fseRepository.findOne({
      where: { id },
      relations: ['user', 'patient'],
    });
    const bank = await this.libraryBankRepository.findOne({
      where: [{ usrId: IsNull() }, { usrId: caresheet?.user?.id }],
      order: {
        isDefault: 'DESC',
        usrId: 'DESC',
        pos: 'ASC',
      },
    });
    const thirdPartyAmcs = await this.thirdPartyAmcRepository.find({
      relations: ['amc'],
    });
    const thirdPartyAmos = await this.thirdPartyAmoRepository.find({
      relations: ['amo'],
    });

    const payment: CashingEntity = {
      usrId: caresheet?.user?.id,
      lbkId: bank?.id,
      date: payload?.creation_date,
      paymentDate: payload?.creation_date,
      payment: EnumCashingPayment.VIREMENT,
      type: EnumCashingType.SOLDE,
      debtor: `TP-${format(new Date(payload?.creation_date), 'yyyyMMdd')}-${
        caresheet?.nbr
      }`,
      amount: 0,
      amountCare: 0,
      amountProsthesis: 0,
      thirdPartyAmos: [],
      thirdPartyAmcs: [],
      payees: [],
    };
    const thirdPartyAmo = thirdPartyAmos.find(
      (tp) => tp?.caresheetId === caresheet?.id,
    );
    const thirdPartyAmc = thirdPartyAmcs.find(
      (tp) => tp?.caresheetId === caresheet?.id,
    );
    if (thirdPartyAmo && payload?.amo_amount !== 0) {
      const amountRemaining =
        parseFloat(thirdPartyAmo?.amount.toString()) -
        parseFloat(thirdPartyAmo?.amountPaid?.toString());
      const amountCareRemaining =
        parseFloat(thirdPartyAmo?.amountCare?.toString()) -
        parseFloat(thirdPartyAmo?.amountCarePaid?.toString());
      const amountPaid = Math.max(
        -thirdPartyAmo?.amountPaid,
        Math.min(amountRemaining, payload?.amo_amount),
      );
      const amountCarePaid = Math.max(
        -thirdPartyAmo?.amountCarePaid,
        Math.min(amountCareRemaining, amountPaid),
      );
      const amountProsthesisPaid = amountPaid - amountCarePaid;

      thirdPartyAmo.amountPaid =
        parseFloat(thirdPartyAmo?.amountPaid?.toString()) + amountPaid;
      thirdPartyAmo.amountPaidManually =
        parseFloat(thirdPartyAmo?.amountPaidManually?.toString()) + amountPaid;
      thirdPartyAmo.amountCarePaid =
        parseFloat(thirdPartyAmo?.amountCarePaid?.toString()) + amountCarePaid;
      thirdPartyAmo.amountProsthesisPaid =
        parseFloat(thirdPartyAmo?.amountProsthesisPaid?.toString()) +
        amountProsthesisPaid;
      const amountRemainingAmo =
        parseFloat(thirdPartyAmo?.amount.toString()) -
        parseFloat(thirdPartyAmo?.amountPaid?.toString());

      let status = EnumThirdPartyStatus.INCOMPLETE;
      if (!amountRemainingAmo) {
        status = EnumThirdPartyStatus.PAID;
      } else if (!thirdPartyAmo?.amountPaid) {
        status = EnumThirdPartyStatus.WAITING;
      }
      thirdPartyAmo.status = status;
      payment.amount = payment.amount + amountPaid;
      payment.amountCare = payment.amountCare + amountCarePaid;
      payment.amountProsthesis =
        payment.amountProsthesis + amountProsthesisPaid;
      payment.debtor = `${payment.debtor}-(AMO)${thirdPartyAmo?.amo?.libelle}`;
      payment.isTp = 1;
      await this.thirdPartyAmoRepository.update(
        thirdPartyAmo.id,
        thirdPartyAmo,
      );
      payment.thirdPartyAmos.push(thirdPartyAmo);
    }

    if (thirdPartyAmc && payload?.amc_amount !== 0) {
      const amountRemaining = thirdPartyAmc?.amount - thirdPartyAmc?.amountPaid;
      const amountCareRemaining =
        thirdPartyAmc?.amountCare - thirdPartyAmc?.amountCarePaid;
      const amountPaid = Math.max(
        -thirdPartyAmc?.amountPaid,
        Math.min(amountRemaining, payload?.amo_amount),
      );
      const amountCarePaid = Math.max(
        -thirdPartyAmc?.amountCarePaid,
        Math.min(amountCareRemaining, amountPaid),
      );
      const amountProsthesisPaid = amountPaid - amountCarePaid;

      thirdPartyAmc.amountPaid =
        parseFloat(thirdPartyAmc?.amountPaid.toString()) + amountPaid;
      thirdPartyAmc.amountPaidManually =
        parseFloat(thirdPartyAmc?.amountPaidManually.toString()) + amountPaid;
      thirdPartyAmc.amountCarePaid =
        parseFloat(thirdPartyAmc?.amountCarePaid.toString()) + amountCarePaid;
      thirdPartyAmc.amountProsthesisPaid =
        parseFloat(thirdPartyAmc?.amountProsthesisPaid?.toString()) +
        amountProsthesisPaid;
      const amountRemainingAmc =
        parseFloat(thirdPartyAmc?.amount.toString()) -
        parseFloat(thirdPartyAmc?.amountPaid?.toString());

      let status = EnumThirdPartyStatus.INCOMPLETE;
      if (!amountRemainingAmc) {
        status = EnumThirdPartyStatus.PAID;
      } else if (!thirdPartyAmc?.amountPaid) {
        status = EnumThirdPartyStatus.WAITING;
      }
      thirdPartyAmc.status = status;
      payment.amount = payment.amount + amountPaid;
      payment.amountCare = payment.amountCare + amountCarePaid;
      payment.amountProsthesis =
        payment.amountProsthesis + amountProsthesisPaid;
      payment.debtor = `${payment.debtor}-(AMC)${thirdPartyAmc?.amc?.libelle}`;
      payment.isTp = 1;
      await this.thirdPartyAmcRepository.update(
        thirdPartyAmc.id,
        thirdPartyAmc,
      );
      payment.thirdPartyAmcs.push(thirdPartyAmc);
    }
    const thirdPartyAmoStatus = thirdPartyAmo ? thirdPartyAmo?.status : null;
    const thirdPartyAmcStatus = thirdPartyAmc ? thirdPartyAmc?.status : null;
    if (
      thirdPartyAmoStatus === EnumThirdPartyStatus.REJECTED ||
      thirdPartyAmcStatus === EnumThirdPartyStatus.REJECTED
    ) {
      caresheet.tiersPayantStatus = EnumThirdPartyStatus.REJECTED;
    } else if (
      (!thirdPartyAmoStatus ||
        thirdPartyAmoStatus === EnumThirdPartyStatus.PAID) &&
      (!thirdPartyAmcStatus ||
        thirdPartyAmcStatus === EnumThirdPartyStatus.PAID)
    ) {
      caresheet.tiersPayantStatus = EnumThirdPartyStatus.PAID;
    } else {
      caresheet.tiersPayantStatus = EnumThirdPartyStatus.WAITING;
    }
    caresheet.thirdPartyAmountPaid =
      (thirdPartyAmo?.amountPaid ? thirdPartyAmo.amountPaid : 0) +
      (thirdPartyAmc?.amountPaid ? thirdPartyAmc.amountPaid : 0);
    await this.fseRepository.update(caresheet.id, caresheet);
    if (payload?.create_payment && payment?.amount !== 0) {
      const paymentPayee = new CashingContactEntity();
      paymentPayee.patient = caresheet.patient;
      paymentPayee.amount = payment.amount;
      paymentPayee.amountCare = payment.amountCare;
      paymentPayee.amountProsthesis = payment.amountProsthesis;
      payment.payees.push(paymentPayee);
      const paymentRes = await this.cashingRepository.save(payment);
      paymentPayee.csgId = paymentRes?.id;
      await this.cashingContactRepository.save(paymentPayee);
    }
    const data = await this.actsService.show(caresheet.id);
    return data;
  }

  /**
   * File: php/third-party/print.php 100%
   *
   */
  async printThirdParty(payload: ThirdPartyDto) {
    const user = await this.userRepository.findOne({
      where: { id: payload?.user_id },
    });
    if (!user) {
      throw new CNotFoundRequestException(ErrorCode.NOT_FOUND_USER);
    }

    const queryBuilder = this.fseRepository
      .createQueryBuilder('caresheet')
      .innerJoinAndSelect('caresheet.patient', 'patient')
      .where('caresheet.usrId = :usrId', { usrId: user.id })
      .andWhere('caresheet.tiersPayant = true');

    payload.filterParam?.forEach((param, index) => {
      const valueParam = payload.filterValue[index];
      switch (param) {
        case 'caresheet.creationDate':
          queryBuilder.andWhere('caresheet.FSE_DATE = :creationDate', {
            creationDate: valueParam,
          });
          break;
        case 'caresheet.number':
          queryBuilder.andWhere('caresheet.nbr = LPAD(:number, 9, 0)', {
            number: valueParam,
          });
          break;
        case 'caresheet.tiersPayantStatus':
          queryBuilder.andWhere(
            'caresheet.tiersPayantStatus = :tiersPayantStatus',
            { tiersPayantStatus: valueParam },
          );
          break;
        case 'amo.libelle':
          queryBuilder.innerJoin(
            ThirdPartyAmoEntity,
            'thirdPartyAmo',
            'thirdPartyAmo.caresheetId = caresheet.id',
          );
          queryBuilder.innerJoin(
            AmoEntity,
            'amo',
            'thirdPartyAmo.amoId = amo.id',
          );
          queryBuilder.andWhere('amo.libelle LIKE :amoLibelle', {
            amoLibelle: `${valueParam}%`,
          });
          break;
        case 'amc.libelle':
          queryBuilder.innerJoin(
            ThirdPartyAmcEntity,
            'thirdPartyAmc',
            'thirdPartyAmc.caresheetId = caresheet.id',
          );
          queryBuilder.innerJoin(
            AmcEntity,
            'amc',
            'thirdPartyAmc.amcId = amc.id',
          );
          queryBuilder.andWhere('amc.libelle LIKE :amcLibelle', {
            amcLibelle: `${valueParam}%`,
          });
          break;
      }
    });

    const sortList = payload?.sort?.split('+') ?? [];
    for (const sortItem of sortList) {
      const sort = thirdPartySort[sortItem];
      queryBuilder.addOrderBy(
        sort,
        payload.direction?.toLocaleLowerCase() === 'asc' ? 'ASC' : 'DESC',
      );
    }
    const caresheets = await queryBuilder.getMany();

    const thirdPartyAmcs = await this.thirdPartyAmcRepository.find({
      select: ['id', 'status', 'caresheetId', 'amcId'],
      relations: ['amc'],
    });

    const thirdPartyAmos = await this.thirdPartyAmoRepository.find({
      select: ['id', 'status', 'caresheetId', 'amoId'],
      relations: ['amo'],
    });

    const newCaresheets = caresheets.map((item) => {
      return {
        ...item,
        thirdPartyAmountRemaining:
          item.thirdPartyAmount - item.thirdPartyAmountPaid,
        thirdPartyAmo: thirdPartyAmos.find(
          (tpamo) => tpamo?.caresheetId === item?.id,
        ),
        thirdPartyAmc: thirdPartyAmcs.find(
          (tpamc) => tpamc?.caresheetId === item?.id,
        ),
      };
    });

    let thirdPartyAmountTotal = 0;
    let thirdPartyAmountPaidTotal = 0;
    let thirdPartyAmountRemainingTotal = 0;
    for (const key of newCaresheets) {
      thirdPartyAmountTotal += +key.thirdPartyAmount;
      thirdPartyAmountPaidTotal += +key.thirdPartyAmountPaid;
      thirdPartyAmountRemainingTotal += +key.thirdPartyAmountRemaining;
    }

    const currencyObj = await this.userPreferenceRepo.findOneOrFail({
      select: ['currency'],
      where: {
        usrId: user.id,
      },
    });

    const data = {
      user,
      caresheets: newCaresheets,
      currency: currencyObj?.currency,
      thirdPartyAmountTotal,
      thirdPartyAmountPaidTotal,
      thirdPartyAmountRemainingTotal,
    };

    const templates = `<html lang='fr'>
  <head>
    <meta charset='UTF-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <meta http-equiv='X-UA-Compatible' content='ie=edge' />
    <title>Suivi des tiers payants</title>
    <style>
      html { margin: 0; padding: 0; font-family: Arial; } body { margin: 0;
      padding: 0; } .status-WTN { color: #6e7687; background-color: #e9ecef;
      border-radius: 50px; } .status-INK { color: #ffffff; background-color:
      #ffc107; border-radius: 50px; } .status-PYD { color: #ffffff;
      background-color: #28a745; border-radius: 50px; } .status-RJT { color:
      #ffffff; background-color: #dc3545; border-radius: 50px; } table { width:
      100%; border-collapse: collapse; font-size: 9pt; } table th, table td {
      vertical-align: top; padding: 2mm 2mm; border: 0.1pt solid #000000; }
      table thead th { text-align: center; } table tr.tfoot { font-weight: bold;
      } td.amoStatusReadable { width: 5%; text-align: center; }
      td.amcStatusReadable { width: 5%; text-align: center; } td.creationDate {
      width: 8%; text-align: center; } td.number { width: 8%; text-align:
      center; } td.amoLibelle { width: 10%; text-align: center; } td.amcLibelle
      { width: 10%; text-align: center; } td.amount { width: 8%; text-align:
      right; } td.amountPaid { width: 8%; text-align: right; }
      td.amountRemaining { width: 8%; text-align: right; }

    </style>
  </head>
  <body>
    <table>
      <thead>
        <tr>
          <th colspan='2'>État</th>
          <th class='creationDate'>Date</th>
          <th class='number'>Numéro</th>
          <th class='patientFullName'>Patient</th>
          <th class='amoLibelle'>AMO</th>
          <th class='amcLibelle'>AMC</th>
          <th class='amount'>Montant</th>
          <th class='amountPaid'>Montant payé</th>
          <th class='amountRemaining'>Montant restant</th>
        </tr>
      </thead>
      <tbody>
        {{#each caresheets}}
          <tr>
            <td class='amoStatusReadable'>
              {{#if this.thirdPartyAmo}}
                <div class='status-{{this.thirdPartyAmo.status}}'>
                  AMO
                </div>
              {{/if}}
            </td>
            <td class='amcStatusReadable'>
              {{#if this.thirdPartyAmc}}
                <div class='status-{{this.thirdPartyAmc.status}}'>
                  AMC
                </div>
              {{/if}}
            </td>
            <td class='creationDate'>{{dateShort this.date}}</td>
            <td class='number'>{{this.nbr}}</td>
            <td class='patientFullName'>{{this.patient.lastname}}
              {{this.patient.firstname}}</td>
            <td class='amoLibelle'>{{this.thirdPartyAmo.amo.libelle}}</td>
            <td class='amcLibelle'>{{this.thirdPartyAmc.amc.libelle}}</td>
            <td class='amount'>{{this.thirdPartyAmount}} {{../currency}}</td>
            <td class="amountPaid">{{this.thirdPartyAmountPaid}} {{../currency}}</td>
            <td class="amountRemaining">{{this.thirdPartyAmountRemaining}} {{../currency}}</td>
          </tr>
        {{/each}}
        <tr class="tfoot">
                <td colspan="7"></th>
                <td class="amount">{{ thirdPartyAmountTotal}} {{currency}}</td>
                <td class="amountPaid">{{ thirdPartyAmountPaidTotal}} {{currency}}</td>
                <td class="amountRemaining">{{ thirdPartyAmountRemainingTotal}} {{currency}}</td>
            </tr>
      </tbody>

    </table>
  </body>
    </html>`;

    Handlebars.registerHelper('dateShort', function (date) {
      return date ? dayjs(date).format('DD/MM/YYYY') : '';
    });

    return Handlebars.compile(templates)(data);
  }
}
