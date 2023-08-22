import { Injectable } from '@nestjs/common';
import { addressFormatter } from 'src/common/formatter';
import { AddressEntity } from 'src/entities/address.entity';
import { CorrespondentTypeEntity } from 'src/entities/correspondent-type.entity';
import { CorrespondentEntity } from 'src/entities/correspondent.entity';
import { PhoneEntity } from 'src/entities/phone.entity';
import { DataSource } from 'typeorm';
import { Workbook } from 'exceljs';
import { Response } from 'express';
import { Parser } from 'json2csv';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { UserIdentity } from 'src/common/decorator/auth.decorator';

@Injectable()
export class AddressBookService {
  constructor(private dataSource: DataSource) {}

  /**
   *
   * Function: application/Repository/AddressBookRepository.php
   *
   * @return AbstractQuery
   */
  async _getExportQuery(identity: UserIdentity) {
    const query = this.dataSource
      .createQueryBuilder()
      .select(
        'DISTINCT `addressBook`.*, `category`.*, `address`.*, GROUP_CONCAT(phoneNumber.nbr) AS phoneNumber_numbers ',
      )
      .from(CorrespondentEntity, 'addressBook')
      .leftJoin(
        CorrespondentTypeEntity,
        'category',
        'addressBook.correspondent_type_id = category.id',
      )
      .leftJoin(AddressEntity, 'address', 'addressBook.ADR_ID = address.id')
      .leftJoin(PhoneEntity, 'phoneNumber', 'addressBook.id = phoneNumber.id')
      .where('category.id IS NULL')
      .orWhere('category.id NOT IN (:...ids)', { ids: [1, 2] })
      .andWhere('addressBook.organization_id = :identity', {
        identity: identity.org,
      })
      .addGroupBy('addressBook.id')
      .orderBy('addressBook.lastName, addressBook.firstName');
    return await query.getRawMany();
  }

  /**
   * File: php/address-books/export.php 100%
   *
   * @param res
   * @param format
   * @param identity
   */

  async export(res: Response, format: string, identity: UserIdentity) {
    try {
      const addressBooks = await this._getExportQuery(identity);
      const rows = [];
      for (const addressBook of addressBooks) {
        rows.push({
          id: addressBook.CPD_ID,
          lastName: addressBook.CPD_LASTNAME,
          firstName: addressBook.CPD_FIRSTNAME,
          email: addressBook.CPD_EMAIL,
          categoryName: addressBook.name,
          phoneNumber: addressBook.phoneNumber_numbers,
          address: addressFormatter({
            street: addressBook?.ADR_STREET || '',
            street2: addressBook?.ADR_STREET_COMP || '',
            zipCode: addressBook?.ADR_ZIP_CODE || '',
            city: addressBook?.ADR_CITY || '',
            country: addressBook?.ADR_COUNTRY || '',
          }),
          observation: addressBook.CPD_MSG,
        });
      }

      if (format.trim().toLocaleLowerCase() === 'csv') {
        const fields = [
          { label: 'Nom', value: 'lastName' },
          { label: 'Prénom', value: 'firstName' },
          { label: 'E-mail', value: 'email' },
          { label: 'Catégorie', value: 'categoryName' },
          { label: 'Téléphone', value: 'phoneNumber' },
          { label: 'Adresse', value: 'address' },
          { label: 'Commentaire', value: 'observation' },
        ];
        const parser = new Parser({ fields });
        const data = parser.parse(rows);
        res.header('Content-Type', 'text/csv');
        res.attachment('correspondants.csv');
        res.status(200).send(data);
      } else {
        const book = new Workbook();
        const sheet = book.addWorksheet('Sheet1');

        sheet.columns = [
          { header: 'Nom', key: 'lastName' },
          { header: 'Prénom', key: 'firstName' },
          { header: 'E-mail', key: 'email' },
          { header: 'Catégorie', key: 'categoryName' },
          { header: 'Téléphone', key: 'phoneNumber' },
          { header: 'Adresse', key: 'address' },
          { header: 'Commentaire', key: 'observation' },
        ];
        sheet.getColumn(1).width = 15;
        sheet.getColumn(2).width = 20;
        sheet.getColumn(3).width = 15;
        sheet.getColumn(4).width = 15;
        sheet.getColumn(5).width = 15;
        sheet.getColumn(6).width = 15;
        sheet.getColumn(7).width = 15;

        sheet.addRows(rows);
        const filename = `correspondants.xlsx`;
        res.set({
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename=' + filename,
        });
        await book.xlsx.write(res);
        res.end();
      }
    } catch (e) {
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }
}
