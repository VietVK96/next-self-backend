import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { PatientExportDto } from '../dto/index.dto';
import { DataSource } from 'typeorm';
import { ContactEntity } from '../../entities/contact.entity';
import { Workbook } from 'exceljs';
import { Response } from 'express';
import { AddressEntity } from '../../entities/address.entity';
import { PhoneEntity } from '../../entities/phone.entity';
import {
  addressFormatter,
  inseeFormatter,
  dateFormatter,
} from '../../common/formatter/index';
import { Parser } from 'json2csv';

const TypeFile = {
  EXCEL: 'xlsx',
  CSV: 'csv',
};

@Injectable()
export class PatientService {
  private readonly logger: Logger = new Logger(PatientService.name);

  constructor(
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
}