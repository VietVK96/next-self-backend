import { Injectable, Logger, NotAcceptableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { endOfDay, format } from 'date-fns';
import { Workbook } from 'exceljs';
import { Response } from 'express';
import { Parser } from 'json2csv';
import { AddressService } from 'src/address/service/address.service';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { ErrorCode } from 'src/constants/error';
import { ContactService } from 'src/contact/services/contact.service';
import { AmcEntity } from 'src/entities/amc.entity';
import { AmoEntity } from 'src/entities/amo.entity';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { FseEntity } from 'src/entities/fse.entity';
import { GenderEntity } from 'src/entities/gender.entity';
import {
  EnumLibraryActNomenclature,
  LibraryActEntity,
} from 'src/entities/library-act.entity';
import { ThirdPartyAmcEntity } from 'src/entities/third-party-amc.entity';
import { ThirdPartyAmoEntity } from 'src/entities/third-party-amo.entity';
import { UploadEntity } from 'src/entities/upload.entity';
import { UserEntity } from 'src/entities/user.entity';
import { PermissionService } from 'src/user/services/permission.service';
import { DataSource, Repository } from 'typeorm';
import {
  addressFormatter,
  dateFormatter,
  inseeFormatter,
} from '../../common/formatter/index';
import { AddressEntity } from '../../entities/address.entity';
import { ContactEntity } from '../../entities/contact.entity';
import { PhoneEntity } from '../../entities/phone.entity';
import {
  PatientActsDependenciesDto,
  PatientExportDto,
  PatientThirdPartyDto,
  RelauchDto,
} from '../dto/index.dto';
import { PatientThirdPartyRes } from '../reponse/index.res';
import { CONFIGURATION } from 'src/constants/configuration';
import * as dayjs from 'dayjs';
import { LettersEntity } from 'src/entities/letters.entity';
import { TranformVariableParam } from 'src/mail/dto/transformVariable.dto';
import { DocumentMailService } from 'src/mail/services/document.mail.service';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';

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
    @InjectRepository(LibraryActEntity)
    private libraryActRepository: Repository<LibraryActEntity>,
    @InjectRepository(LettersEntity)
    private mailRepo: Repository<LettersEntity>,
    private documentMailService: DocumentMailService,
    @InjectRepository(ContactNoteEntity)
    private contactNoteRepo: Repository<ContactNoteEntity>,
  ) {}

  async getExportQuery(res: Response, request: PatientExportDto): Promise<any> {
    try {
      {
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
            insee: inseeFormatter(
              `${patient?.CON_INSEE}${patient.CON_INSEE_KEY}`,
            ),
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
    } catch (error) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
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
        .softDelete()
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
    const patientUser = await this.contactUserRepository.findOne({
      where: {
        usrId: userId,
        conId: patientId,
      },
    });
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

  /**
   * application/Services/Patient.php => 180 -> 264
   */
  async getNextReminderByDoctor(id: number, doctorId: number) {
    const patient = await this.dataSource.query(
      `
      SELECT
        CON_REMINDER_VISIT_TYPE AS type,
        CON_REMINDER_VISIT_DATE AS date
      FROM T_CONTACT_CON
      WHERE CON_ID = ?`,
      [id],
    );
    const type = patient?.type;
    if (type === 'date') return patient?.date;
    if (type === 'duration') {
      const duration = await this.dataSource.query(
        `
        SELECT
          USP_REMINDER_VISIT_DURATION
        FROM T_USER_PREFERENCE_USP
        WHERE USR_ID = ?
      `,
        [doctorId],
      );
      return await this.dataSource.query(
        `
        SELECT
            MAX(t1.max_date) + INTERVAL IF(
                CON_REMINDER_VISIT_DURATION IS NULL OR CON_REMINDER_VISIT_DURATION = 0,
                ?,
                CON_REMINDER_VISIT_DURATION
            ) MONTH
        FROM T_CONTACT_CON
        JOIN (
            (
                SELECT
                    MAX(T_EVENT_TASK_ETK.ETK_DATE) AS max_date
                FROM T_CONTACT_CON
                JOIN T_EVENT_TASK_ETK
                WHERE T_CONTACT_CON.CON_ID = ?
                  AND T_CONTACT_CON.CON_ID = T_EVENT_TASK_ETK.CON_ID
                  AND T_EVENT_TASK_ETK.USR_ID = ?
                GROUP BY T_CONTACT_CON.CON_ID
            )
            UNION
            (
                SELECT
                    MAX(event_occurrence_evo.evo_date) AS max_date
                FROM T_CONTACT_CON
                JOIN T_EVENT_EVT
                JOIN event_occurrence_evo
                WHERE T_CONTACT_CON.CON_ID = ?
                  AND T_CONTACT_CON.CON_ID = T_EVENT_EVT.CON_ID
                  AND T_EVENT_EVT.USR_ID = ?
                  AND T_EVENT_EVT.EVT_ID = event_occurrence_evo.evt_id
                GROUP BY T_CONTACT_CON.CON_ID
            )
        ) AS t1
        WHERE T_CONTACT_CON.CON_ID = ?
      `,
        [duration, id, doctorId, id, doctorId, id],
      );
      return duration ?? null;
    }
  }

  /**
   * application/Services/Patient.php => 180 -> 264
   */
  async getNextAppointment(patientId: number) {
    return await this.dataSource.query(`
      SELECT
        T_EVENT_EVT.EVT_NAME,
        T_EVENT_EVT.EVT_START,
        T_EVENT_EVT.EVT_END
      FROM T_EVENT_EVT
      WHERE
        T_EVENT_EVT.CON_ID = ${patientId} AND
        T_EVENT_EVT.EVT_START > CURRENT_TIMESTAMP() AND
        T_EVENT_EVT.deleted_at IS NULL
      ORDER BY
        T_EVENT_EVT.EVT_START
      LIMIT 1`);
  }

  async getAtcsDependencies(request: PatientActsDependenciesDto) {
    const {
      library_act_id,
      patient_id,
      quote_id,
      status,
      teethNumbers,
      grid = 13,
      check_parent = true,
    } = request;
    const patient = await this.patientRepository.findOne({
      where: { id: patient_id },
      relations: {
        amcs: true,
        medical: true,
      },
    });
    const currentDate = endOfDay(new Date());
    const libraryAct = await this.libraryActRepository.findOne({
      where: { id: library_act_id },
      relations: {
        quantities: {
          ccam: {
            unitPrices: true,
            material: true,
            family: {
              panier: true,
            },
            dependencies: true,
          },
        },
      },
    });
    const libraryActQuantities = libraryAct.quantities;
    const libraryActQuantitiesFiltered = libraryActQuantities?.filter(
      (quantity) => quantity.numberOfTeeth === teethNumbers?.length,
    );
    if (libraryAct?.nomenclature === EnumLibraryActNomenclature.NGAP) {
      if (
        libraryActQuantities?.length === 1 ||
        libraryActQuantitiesFiltered.length === 0
      ) {
        return { id: libraryActQuantities[0]?.id };
      } else if (libraryActQuantitiesFiltered?.length === 1) {
        return { id: libraryActQuantities[0]?.id };
      } else {
        return {
          multiple_choice: true,
          items: [
            {
              label: 'Actes à choisir',
              values: libraryActQuantitiesFiltered?.map((quantity) => ({
                id: quantity?.id,
                amount: quantity?.amount,
                label: quantity?.label,
              })),
            },
          ],
        };
      }
    }

    if (libraryActQuantities?.length === 1) {
      const libraryActQuantity = libraryActQuantities[0];
      const ccamUnitPrice = libraryActQuantity?.ccam?.unitPrices?.find(
        (unitPrices) => {
          return (
            unitPrices.grid === grid &&
            new Date(unitPrices?.createdOn)?.getTime() <= currentDate?.getTime()
          );
        },
      );
      if (ccamUnitPrice && ccamUnitPrice?.unitPrice === 0) {
        return {
          id: libraryActQuantity?.id,
          dental_material_id: libraryActQuantity?.ccam?.material?.id,
          ccam_panier_code: libraryActQuantity?.ccam?.family?.panier?.code,
        };
      }
    }

    if (libraryActQuantitiesFiltered?.length === 0) {
      if (
        libraryActQuantities?.length === 1 &&
        libraryActQuantities[0]?.numberOfTeeth === 0
      ) {
        const libraryActQuantity = libraryActQuantities[0];
        return {
          id: libraryActQuantity.id,
          dental_material_id: libraryActQuantity?.ccam?.material?.id,
          teeth_numbers: [],
          ccam_panier_code: libraryActQuantity?.ccam?.family?.panier?.code,
        };
      }
      throw new CNotFoundRequestException(ErrorCode.NOT_FOUND);
    }

    if (libraryActQuantitiesFiltered?.length === 1) {
      const libraryActQuantity = libraryActQuantitiesFiltered[0];
      return {
        id: libraryActQuantity.id,
        dental_material_id: libraryActQuantity?.ccam?.material?.id,
        ccam_panier_code: libraryActQuantity?.ccam?.family?.panier?.code,
      };
    }

    const libraryActQuantitiesFilteredByForbiddenTeeth =
      libraryActQuantitiesFiltered?.filter((quantity) => {
        /**todo */
        return !teethNumbers?.some((teeth) =>
          quantity?.ccam?.forbiddenTeeth?.includes(`${teeth}`),
        );
      });

    if (libraryActQuantitiesFilteredByForbiddenTeeth.length === 0) {
      throw new CNotFoundRequestException(ErrorCode.NOT_FOUND);
    }

    if (libraryActQuantitiesFilteredByForbiddenTeeth.length === 1) {
      const libraryActQuantity =
        libraryActQuantitiesFilteredByForbiddenTeeth[0];
      return {
        id: libraryActQuantity.id,
        dental_material_id: libraryActQuantity?.ccam?.material?.id,
        ccam_panier_code: libraryActQuantity?.ccam?.family?.panier?.code,
      };
    }

    if (check_parent) {
      const libraryActQuantityIds =
        libraryActQuantitiesFilteredByForbiddenTeeth?.map((laq) => laq?.id);
      const inQuery = libraryActQuantityIds?.join(',');
      const conditions: string[] = [];
      if (teethNumbers?.length) {
        conditions.push(`T_DENTAL_EVENT_TASK_DET.DET_TOOTH REGEXP ?`);
      } else {
        conditions.push('T_DENTAL_EVENT_TASK_DET.DET_TOOTH IS NULL');
      }

      if (quote_id) {
        conditions.push('T_PLAN_PLF.PLF_ID = ?');
      } else if (status === 0) {
        conditions.push(
          '(T_PLAN_PLF.PLF_ID IS NULL OR T_PLAN_PLF.PLF_ACCEPTED_ON IS NOT NULL)',
        );
      } else if (status === 1) {
        conditions.push('T_EVENT_TASK_ETK.ETK_STATE > 0');
      }

      const query = `
      SELECT
      id,
      parent_id,
      dental_material_id,
      dental_material_equivalent,
      ccam_panier_code
      FROM (
          SELECT
              library_act_quantity.id,
              T_DENTAL_EVENT_TASK_DET.ETK_ID AS parent_id,
              T_DENTAL_EVENT_TASK_DET.dental_material_id,
              IFNULL(T_DENTAL_EVENT_TASK_DET.dental_material_id = ccam.dental_material_id, 0) AS dental_material_equivalent,
              T_EVENT_TASK_ETK.ETK_DATE,
              T_EVENT_TASK_ETK.created_at,
              ccam_panier.code AS ccam_panier_code
          FROM library_act_quantity
          JOIN ccam
          JOIN ccam_dependence
          JOIN ccam AS ccam2
          JOIN ccam_family ON ccam2.ccam_family_id = ccam_family.id
          LEFT JOIN ccam_panier ON ccam_family.ccam_panier_id = ccam_panier.id
          JOIN T_DENTAL_EVENT_TASK_DET
          JOIN T_EVENT_TASK_ETK
          LEFT OUTER JOIN T_EVENT_EVT ON T_EVENT_EVT.EVT_ID = T_EVENT_TASK_ETK.EVT_ID
          LEFT OUTER JOIN T_PLAN_EVENT_PLV ON T_PLAN_EVENT_PLV.EVT_ID = T_EVENT_EVT.EVT_ID
          LEFT OUTER JOIN T_PLAN_PLF ON T_PLAN_PLF.PLF_ID = T_PLAN_EVENT_PLV.PLF_ID
          WHERE library_act_quantity.id IN (${inQuery})
            AND library_act_quantity.ccam_id = ccam.id
            AND ccam.id = ccam_dependence.ccam_parent_id
            AND ccam_dependence.ccam_child_id = ccam2.id
            AND ccam2.id = T_DENTAL_EVENT_TASK_DET.ccam_id
            AND T_DENTAL_EVENT_TASK_DET.ETK_ID = T_EVENT_TASK_ETK.ETK_ID
            AND T_EVENT_TASK_ETK.parent_id IS NULL
            AND T_EVENT_TASK_ETK.deleted_at IS NULL
            AND T_EVENT_TASK_ETK.CON_ID = ?
            AND ${conditions.join('AND')}
          UNION
          SELECT
              library_act_quantity.id,
              T_DENTAL_EVENT_TASK_DET.ETK_ID AS parent_id,
              T_DENTAL_EVENT_TASK_DET.dental_material_id,
              IFNULL(T_DENTAL_EVENT_TASK_DET.dental_material_id = ccam.dental_material_id, 0) AS dental_material_equivalent,
              T_EVENT_TASK_ETK.ETK_DATE,
              T_EVENT_TASK_ETK.created_at,
              ccam_panier.code AS ccam_panier_code
          FROM library_act_quantity
          JOIN ccam
          JOIN ccam_dependence
          JOIN ccam AS ccam2
          JOIN ccam_family ON ccam2.ccam_family_id = ccam_family.id
          LEFT JOIN ccam_panier ON ccam_family.ccam_panier_id = ccam_panier.id
          JOIN T_DENTAL_EVENT_TASK_DET
          JOIN T_EVENT_TASK_ETK
          LEFT OUTER JOIN T_EVENT_EVT ON T_EVENT_EVT.EVT_ID = T_EVENT_TASK_ETK.EVT_ID
          LEFT OUTER JOIN T_PLAN_EVENT_PLV ON T_PLAN_EVENT_PLV.EVT_ID = T_EVENT_EVT.EVT_ID
          LEFT OUTER JOIN T_PLAN_PLF ON T_PLAN_PLF.PLF_ID = T_PLAN_EVENT_PLV.PLF_ID
          WHERE library_act_quantity.id IN (${inQuery})
            AND library_act_quantity.ccam_id = ccam.id
            AND ccam.id = ccam_dependence.ccam_child_id
            AND ccam_dependence.ccam_parent_id = ccam2.id
            AND ccam2.id = T_DENTAL_EVENT_TASK_DET.ccam_id
            AND T_DENTAL_EVENT_TASK_DET.ETK_ID = T_EVENT_TASK_ETK.ETK_ID
            AND T_EVENT_TASK_ETK.parent_id IS NULL
            AND T_EVENT_TASK_ETK.deleted_at IS NULL
            AND T_EVENT_TASK_ETK.CON_ID = ?
            AND ${conditions.join('AND')}
      ) AS t1
      ORDER BY t1.ETK_DATE DESC, t1.created_at DESC`;

      const parameters: string[] = [
        ...(libraryActQuantityIds + ''),
        patient?.id + '',
      ];
      if (teethNumbers?.length) {
        parameters?.push(teethNumbers?.join('|'));
      }
      if (quote_id) {
        parameters?.push(`${quote_id}`);
      }

      const dependencies = await this.dataSource.query(query, parameters);
      if (dependencies?.length) {
        const dependence = dependencies?.filter(
          (d) => d?.dental_material_equivalent,
        )?.[0];
        if (dependence) {
          return {
            id: dependence?.id,
            parent_id: dependence?.parent_id,
            dental_material_id: dependence?.dental_material_id,
            ccam_panier_code: dependence?.dependence,
          };
        }

        const libraryActQuantitiesFilteredByForbiddenTeethDependence =
          libraryActQuantitiesFilteredByForbiddenTeeth?.filter(
            (libraryActQuantity) => {
              return dependencies?.some(
                (dependence) => dependence?.id === libraryActQuantity?.id,
              );
            },
          );
        if (
          libraryActQuantitiesFilteredByForbiddenTeethDependence?.length === 1
        ) {
          const libraryActQuantity =
            libraryActQuantitiesFilteredByForbiddenTeethDependence[0];
          return {
            id: libraryActQuantity.id,
            dental_material_id: libraryActQuantity?.ccam?.material?.id,
            ccam_panier_code: libraryActQuantity?.ccam?.family?.panier?.code,
            parent_id: dependencies?.[0]?.parent_id,
          };
        }
      }
    }

    const isCmu = (patient: ContactEntity) => {
      const amcs = patient?.amcs?.find((amcs) => {
        const startTime = new Date(amcs?.startDate)?.getTime();
        const endTime = new Date(amcs?.endDate)?.getTime();
        return (
          currentDate?.getTime() >= startTime &&
          currentDate?.getTime() <= endTime
        );
      });

      if (amcs) return amcs?.isCmu;
      if (patient?.medical) {
        const medical = patient?.medical;
        return (
          ['11', '12', '13', '14']?.includes(medical?.serviceAmoCode) &&
          (medical?.serviceAmoStartDate === null ||
            new Date(medical?.serviceAmoStartDate)?.getTime() <=
              currentDate?.getTime()) &&
          (medical?.serviceAmoEndDate === null ||
            new Date(medical?.serviceAmoEndDate)?.getTime() >=
              currentDate?.getTime())
        );
      }
    };
    const patientIsCmu = isCmu(patient);
    if (
      !libraryActQuantitiesFilteredByForbiddenTeeth?.some(
        (quantity) => quantity?.ccam?.dependencies?.length,
      )
    ) {
      return {
        multiple_choice: true,
        items: [
          {
            label: 'Sélectionnez le matériau',
            values: libraryActQuantitiesFilteredByForbiddenTeeth?.map(
              (quantity) => {
                return {
                  id: quantity?.id,
                  label: quantity?.label,
                  amount: quantity?.amount,
                  dental_material_id: quantity?.ccam?.material?.id,
                  ccam_panier_label: quantity?.ccam?.family?.panier?.label,
                  ccam_panier_color: quantity?.ccam?.family?.panier?.color,
                  ccam_panier_code: quantity?.ccam?.family?.panier?.code,
                  is_cmu: patientIsCmu,
                };
              },
            ),
          },
        ],
      };
    }
    return {
      multiple_choice: true,
      items: [
        {
          label: 'Sélectionnez le matériau de la prothèse',
          values: libraryActQuantitiesFilteredByForbiddenTeeth?.map(
            (quantity) => {
              return {
                id: quantity?.id,
                label: quantity?.label,
                amount: quantity?.amount,
                dental_material_id: quantity?.ccam?.material?.id,
                ccam_panier_label: quantity?.ccam?.family?.panier?.label,
                ccam_panier_color: quantity?.ccam?.family?.panier?.color,
                ccam_panier_code: quantity?.ccam?.family?.panier?.code,
                is_cmu: patientIsCmu,
              };
            },
          ),
        },
        {
          label: 'Sélectionnez le panier',
          values: libraryActQuantitiesFilteredByForbiddenTeeth?.map(
            (quantity) => {
              return {
                id: quantity?.id,
                label: quantity?.label,
                amount: quantity?.amount,
                dental_material_id: quantity?.ccam?.material?.id,
                ccam_panier_label: quantity?.ccam?.family?.panier?.label,
                ccam_panier_color: quantity?.ccam?.family?.panier?.color,
                ccam_panier_code: quantity?.ccam?.family?.panier?.code,
                is_cmu: patientIsCmu,
              };
            },
          ),
        },
      ],
    };
  }

  /**
   * php/patients/unpaid/relauch.php
   */
  async relauch(payload: RelauchDto) {
    const patient = await this.patientRepository.findOneOrFail({
      where: {
        id: payload.id,
      },
    });

    const user = await this.userRepository.findOneOrFail({
      where: {
        id: payload.user_id,
      },
    });

    const patientBalance = await this.contactUserRepository.findOne({
      where: {
        conId: patient.id,
        usrId: user.id,
      },
      relations: ['patient'],
    });

    if (!patientBalance) {
      return '<div style="page-break-after: always;">' + '</div>';
    }
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
        patientId: patientBalance.conId,
      };
      const response = await this.documentMailService.transformVariable(
        mailParam,
      );

      if (qr) {
        const patientNode = new ContactNoteEntity();
        patientNode.userId = user.id;
        patientNode.conId = patientBalance.patient.id;
        patientNode.date = dayjs(new Date()).format('YYYY-MM-DD');
        patientNode.message = `Nouveau courrier ${mailName} pour le patient {${patientBalance.relaunchLevel}}`;
        await this.contactUserRepository.save(updatePatientBalance);
        await this.contactNoteRepo.save(patientNode);
      }
      return '<div style="page-break-after: always;">' + response + '</div>';
    } catch (err) {
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }
}
