import { Injectable, Logger, NotAcceptableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workbook } from 'exceljs';
import { Response } from 'express';
import { Parser } from 'json2csv';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import {
  addressFormatter,
  dateFormatter,
  inseeFormatter,
} from '../../common/formatter/index';
import { AddressEntity } from '../../entities/address.entity';
import { ContactEntity } from '../../entities/contact.entity';
import { PhoneEntity } from '../../entities/phone.entity';
import { PatientExportDto, PatientThirdPartyDto } from '../dto/index.dto';
import { GenderEntity } from 'src/entities/gender.entity';
import { AddressService } from 'src/address/service/address.service';
import { ContactService } from 'src/contact/services/contact.service';
import { UploadEntity } from 'src/entities/upload.entity';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { FseEntity } from 'src/entities/fse.entity';
import { ThirdPartyAmoEntity } from 'src/entities/third-party-amo.entity';
import { AmoEntity } from 'src/entities/amo.entity';
import { ThirdPartyAmcEntity } from 'src/entities/third-party-amc.entity';
import { AmcEntity } from 'src/entities/amc.entity';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { PatientThirdPartyRes } from '../reponse/index.res';
import { format } from 'date-fns';
import { PermissionService } from 'src/user/services/permission.service';
import { UserIdentity } from 'src/common/decorator/auth.decorator';

const TypeFile = {
  EXCEL: 'xlsx',
  CSV: 'csv',
};

@Injectable()
export class PatientService {
  private readonly logger: Logger = new Logger(PatientService.name);

  constructor(
    private permissionService: PermissionService,
    private addressService: AddressService,
    private contactService: ContactService,
    private dataSource: DataSource,
    @InjectRepository(ContactEntity)
    private patientRepository: Repository<ContactEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(ContactUserEntity)
    private contactUserRepository: Repository<ContactUserEntity>,
    @InjectRepository(ThirdPartyAmcEntity)
    private thirdPartyAmcRepository: Repository<ThirdPartyAmcEntity>,
    @InjectRepository(ThirdPartyAmoEntity)
    private thirdPartyAmoRepository: Repository<ThirdPartyAmoEntity>,
    @InjectRepository(AmoEntity)
    private amoRepository: Repository<AmoEntity>,
    @InjectRepository(AmcEntity)
    private amcRepository: Repository<AmcEntity>,
  ) {}

  async getExportQuery(res: Response, request: PatientExportDto): Promise<any> {
    const patients = await this.dataSource
      .createQueryBuilder()
      .select(
        'DISTINCT `patient`.*, `address`.*, GROUP_CONCAT(phoneNumber.PHO_NBR) AS phoneNumber_numbers',
      )
      .from(ContactEntity, 'patient')
      .leftJoin(AddressEntity, 'address', 'address.id = patient.id')
      .leftJoin(PhoneEntity, 'phoneNumber', 'phoneNumber.id = patient.id')
      .orderBy('patient.lastname')
      .groupBy('patient.id')
      .getRawMany();

    const rows = [];
    for (const patient of patients) {
      rows.push({
        lastname: patient?.CON_LASTNAME,
        firstname: patient?.CON_FIRSTNAME,
        number: patient?.CON_NBR,
        insee: inseeFormatter(`${patient?.CON_INSEE}${patient.CON_INSEE_KEY}`),
        birth: patient?.CON_BIRTHDAY
          ? dateFormatter(patient?.CON_BIRTHDAY)
          : null,
        email: patient?.CON_MAIL,
        phoneNumber_numbers: patient?.phoneNumber_numbers,
        address: addressFormatter({
          street: patient?.ADR_STREET || '',
          street2: patient?.ADR_STREET_COMP || '',
          zipCode: patient?.ADR_ZIP_CODE || '',
          city: patient?.ADR_CITY || '',
          country: patient?.ADR_COUNTRY || '',
        }),
      });
    }
    if (request.format === TypeFile.CSV) {
      const fields = [
        { label: 'Nom', value: 'lastname' },
        { label: 'Prénom', value: 'firstname' },
        { label: 'Numéro de dossier', value: 'number' },
        { label: 'Numéro de sécurité sociale', value: 'insee' },
        { label: 'Date de naissance', value: 'birth' },
        { label: 'E-mail', value: 'email' },
        { label: 'Téléphone', value: 'phone' },
        { label: 'Adresse', value: 'address' },
      ];
      const parser = new Parser({ fields });
      const data = parser.parse(rows);
      res.header('Content-Type', 'text/csv');
      res.attachment('patient.csv');
      res.status(200).send(data);
    } else {
      const book = new Workbook();
      const sheet = book.addWorksheet('Sheet1');
      sheet.columns = [
        { header: 'Nom', key: 'lastname' },
        { header: 'Prénom', key: 'firstname' },
        { header: 'Numéro de dossier', key: 'number' },
        { header: 'Numéro de sécurité sociale', key: 'insee' },
        { header: 'Date de naissance', key: 'birth' },
        { header: 'E-mail', key: 'email' },
        { header: 'Téléphone', key: 'phoneNumber_numbers' },
        { header: 'Adresse', key: 'address' },
      ];
      sheet.getColumn(1).width = 15;
      sheet.getColumn(2).width = 20;
      sheet.getColumn(3).width = 15;
      sheet.getColumn(4).width = 15;
      sheet.getColumn(5).width = 15;
      sheet.getColumn(6).width = 15;
      sheet.getColumn(7).width = 15;
      sheet.getColumn(8).width = 15;

      sheet.addRows(rows);
      const filename = `patient.xlsx`;
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=' + filename,
      });
      await book.xlsx.write(res);
      res.end();
    }
  }

  async deletePatient(id: number, identity: UserIdentity): Promise<any> {
    if (
      !this.permissionService.hasPermission('PERMISSION_DELETE', 8, identity.id)
    ) {
      throw new NotAcceptableException();
    }
    try {
      const patient = await this.dataSource
        .createQueryBuilder()
        .select('CON')
        .from(ContactEntity, 'CON')
        .where('CON.id = :id', { id })
        .getOne();

      if (!patient) throw new CBadRequestException(ErrorCode.NOT_FOUND_PATIENT);
      return await this.dataSource
        .getRepository(ContactEntity)
        .createQueryBuilder()
        .delete()
        .where('id = :id', { id: patient?.id })
        .execute();
    } catch (error) {
      throw new CBadRequestException(error?.response?.msg || error?.sqlMessage);
    }
  }

  /**
   *  application/Services/Patient.php
   *  find()
   */
  async find(id: number) {
    const selectPatient = `
    CON.CON_ID AS id,
    CON.ADR_ID AS address_id,
    CON.CON_NBR AS number,
    CON.CON_LASTNAME AS lastname,
    CON.CON_FIRSTNAME AS firstname,
    CON.CON_BIRTHDAY AS birthday,
    CON.CON_MAIL AS email,
    CON.CON_MSG AS description,
    CON.CON_INSEE AS insee,
    CON.CON_INSEE_KEY AS insee_key
    `;
    const patientPR = this.dataSource
      .createQueryBuilder()
      .select(selectPatient)
      .from(ContactEntity, 'CON')
      .where('CON.CON_ID = :id', { id })
      .getRawOne();

    const selectCivility = `
      GEN.GEN_ID AS id,
      GEN.GEN_NAME AS name,
      GEN.long_name AS long_name,
      GEN.GEN_TYPE AS sex
    `;
    const civilityPR = this.dataSource
      .createQueryBuilder()
      .select(selectCivility)
      .from(ContactEntity, 'CON')
      .innerJoin(GenderEntity, 'GEN')
      .where('CON.CON_ID = :id', { id })
      .andWhere('GEN.GEN_ID = CON.GEN_ID')
      .getRawOne();

    const addressPR = this.addressService.find(id);
    const phonesPR = this.contactService.findPhone(id);

    const selectAvatar = `
      UPL.UPL_ID AS id,
      UPL.UPL_NAME AS original_filename,
      UPL.UPL_FILENAME AS filename,
      UPL.UPL_TYPE AS mimetype,
      UPL.UPL_SIZE AS size,
      UPL.UPL_TOKEN AS token,
      UPL.created_at
    `;
    const avatarPR = this.dataSource
      .createQueryBuilder()
      .select(selectAvatar)
      .from(UploadEntity, 'UPL')
      .innerJoin(ContactEntity, 'CON')
      .where('UPL.UPL_ID = CON.UPL_ID')
      .andWhere('CON.CON_ID = :id', { id })
      .getRawOne();

    const selectDoctorStm = `
      USR.USR_ID AS id,
      USR.USR_LASTNAME AS lastname,
      USR.USR_FIRSTNAME AS firstname,
      USR.USR_ABBR AS short_name
    `;
    const doctorStmPR = this.dataSource
      .createQueryBuilder()
      .select(selectDoctorStm)
      .from(UserEntity, 'USR')
      .innerJoin(ContactEntity, 'CON')
      .where('CON.CON_ID = :id', { id })
      .andWhere('CON.USR_ID = USR.USR_ID')
      .getRawOne();
    const selectDoctors = `
      cou.usr_id AS id,
      cou.cou_amount_due AS amount_due,
      cou.amount_due_care AS amount_due_care,
      cou.amount_due_prosthesis AS amount_due_prosthesis,
      cou.cou_last_payment AS last_payment,
      cou.cou_last_care AS last_care
    `;
    const doctorsPR = this.dataSource
      .createQueryBuilder()
      .select(selectDoctors)
      .from(ContactUserEntity, 'cou')
      .where('cou.con_id = :id', { id })
      .getRawMany();

    const [patient, civility, address, phones, avatar, doctorStm, doctors] =
      await Promise.all([
        patientPR,
        civilityPR,
        addressPR,
        phonesPR,
        avatarPR,
        doctorStmPR,
        doctorsPR,
      ]);

    const doctorsRes = doctors.map((doctor) => {
      return {
        id: doctor.id,
        pivot: {
          amount_due: doctor.amount_due,
          amount_due_care: doctor.amount_due_care,
          amount_due_prosthesis: doctor.amount_due_prosthesis,
          last_payment: doctor.last_payment,
          last_care: doctor.last_care,
        },
      };
    });

    return {
      ...patient,
      civility,
      address,
      phones,
      avatar,
      doctor: doctorStm,
      doctors: doctorsRes,
    };
  }

  /**
   * application/Entity/Patient.php
   * getPatientUser() 684 -> 700
   *
   */
  async getPatientUser(userId: number, patientId: number) {
    const patient = await this.patientRepository.find({
      where: { id: patientId },
      relations: {
        patientUsers: true,
      },
    });

    const patientUser = patient[0].patientUsers.find((e) => e.usrId === userId);
    if (patientUser) {
      return patientUser;
    }

    // ! this save not working with err
    // Column 'cou_last_care' specified twice
    // PHP Code with same err
    return await this.contactUserRepository.save({
      conId: patientId,
      usrId: userId,
    });
  }

  /**
   * File: php/patient/third-patry/index.php
   * Line: 18 -> 112
   */
  async getPatientThirdParty(payload: PatientThirdPartyDto) {
    const { id, direction, page, per_page, sort } = payload;
    const filterParam: string[] = Array.isArray(payload?.filterParam)
      ? payload?.filterParam
      : [payload?.filterParam] || [];
    const filterValue: string[] = Array.isArray(payload?.filterValue)
      ? payload?.filterValue
      : [payload?.filterValue] || [];
    const patient = await this.patientRepository.findOne({ where: { id } });
    if (!patient) {
      throw new CNotFoundRequestException('Patient Not Found');
    }
    const sortParam =
      sort === 'caresheet.creationDate' ? 'caresheet.date' : 'caresheet.nbr';
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
      .andWhere('caresheet.conId = :conId', { conId: patient.id })
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
          queryBuilder.andWhere('caresheet.number = LPAD(:number, 9, 0)', {
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
    const queryResult: FseEntity[] = await queryBuilder
      .orderBy(
        sortParam,
        direction?.toLocaleLowerCase() === 'asc' ? 'ASC' : 'DESC',
      )
      .getRawMany();
    const patientThirdParties = queryResult.map((item: FseEntity) => {
      const res: PatientThirdPartyRes = {
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
    const offSet = (page - 1) * per_page;
    const dataPaging = patientThirdParties.slice(offSet, offSet + per_page);
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
   * php/patients/contraindications/index.php
   */
  async findAllContraindications(id: number) {
    const patient: ContactEntity = await this.patientRepository.findOne({
      relations: {
        contraindications: true,
      },
      where: {
        id: id,
      },
    });

    return patient?.contraindications.sort((a, b) => a.position - b.position);
  }
}
