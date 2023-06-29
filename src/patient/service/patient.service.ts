import { Injectable, Logger } from '@nestjs/common';
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
import { PatientExportDto } from '../dto/index.dto';
import { GenderEntity } from 'src/entities/gender.entity';
import { AddressService } from 'src/address/service/address.service';
import { ContactService } from 'src/contact/services/contact.service';
import { UploadEntity } from 'src/entities/upload.entity';
import { ContactUserEntity } from 'src/entities/contact-user.entity';

const TypeFile = {
  EXCEL: 'xlsx',
  CSV: 'csv',
};

@Injectable()
export class PatientService {
  private readonly logger: Logger = new Logger(PatientService.name);

  constructor(
    private addressService: AddressService,
    private contactService: ContactService,
    private dataSource: DataSource,
    @InjectRepository(ContactEntity)
    private patientRepository: Repository<ContactEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async getExportQuery(res: Response, request: PatientExportDto): Promise<any> {
    const patients = await this.dataSource
      .createQueryBuilder()
      .select(
        'DISTINCT `patient`.*, `address`.*, GROUP_CONCAT(phoneNumber.number) AS phoneNumber_numbers',
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

  async deletePatient(id: number): Promise<any> {
    // Vérification de la permission de suppression d'une fiche patient.
    // if (!$em -> getRepository(User:: class) -> hasPermission('PERMISSION_DELETE', 8, $session -> get('id'))) {
    //   throw new AccessDeniedHttpException();
    // }
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
}
