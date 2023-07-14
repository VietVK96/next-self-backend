import { Injectable } from '@nestjs/common';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { Connection, DataSource, Repository } from 'typeorm';
import { CreateUpdateCorrespondentDto } from '../dto/createUpdateCorrespondent.dto';
import { CorrespondentTypeEntity } from 'src/entities/correspondent-type.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PhoneEntity } from 'src/entities/phone.entity';
import {
  CorrespondentRes,
  LookUpRes,
  findAllCorrRes,
} from '../response/find.correspondent.res';
import { UserEntity } from 'src/entities/user.entity';
import { CorrespondentEntity } from 'src/entities/correspondent.entity';
import { Response } from 'express';
import { Parser } from 'json2csv';
import {
  addressFormatter,
  dateFormatter,
  inseeFormatter,
} from '../../common/formatter/index';
import { ContactEntity } from 'src/entities/contact.entity';
import { AddressEntity } from 'src/entities/address.entity';

@Injectable()
export class CorrespondentService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly connection: Connection,
    @InjectRepository(PhoneEntity)
    private readonly phoneRepo: Repository<PhoneEntity>,
    @InjectRepository(CorrespondentEntity)
    private readonly corresRepo: Repository<CorrespondentEntity>,
  ) {}

  async lookUp(groupId: number, term: string): Promise<LookUpRes[]> {
    const results = await this.dataSource.query(
      `SELECT CPD_ID as id, CPD_LASTNAME as lastname, CPD_FIRSTNAME as 
      firstname,CPD_MAIL as email,CPD_MSG as msg,created_at as createdAt,updated_at as updatedAt,
      correspondent_type.id as correspondentTypeId , correspondent_type.name as correspondentTypeName 
FROM T_CORRESPONDENT_CPD CPD LEFT JOIN correspondent_type ON CPD.correspondent_type_id = correspondent_type.id
WHERE CPD.organization_id = ? AND ( CPD.CPD_LASTNAME LIKE ? or CPD.CPD_FIRSTNAME LIKE ?)`,
      [groupId, term + '%', term + '%'],
    );
    for (const iterator of results) {
      iterator.correspondent_type =
        iterator.correspondentTypeId === null
          ? null
          : {
              id: iterator.correspondentTypeId,
              name: iterator.correspondentTypeName,
            };
      delete iterator.correspondentTypeId;
      delete iterator.correspondentTypeName;
    }
    return results;
  }

  async find(id: number): Promise<CorrespondentRes> {
    const correspondents = await this.dataSource.query(
      `SELECT CPD_ID as id, CPD_LASTNAME as lastname, CPD_FIRSTNAME as firstname, 
      CPD_MAIL as email, CPD_MSG as description,GEN.GEN_ID, GEN.GEN_NAME, GEN.long_name, GEN.GEN_TYPE,
      ADR.ADR_ID, ADR.ADR_STREET, ADR.ADR_STREET_COMP, ADR.ADR_ZIP_CODE, ADR.ADR_CITY, ADR.ADR_COUNTRY, 
      ADR.ADR_COUNTRY_ABBR,correspondent_type.id as typeId,correspondent_type.name as typeName FROM T_CORRESPONDENT_CPD CPD LEFT JOIN T_GENDER_GEN GEN ON CPD.GEN_ID = GEN.GEN_ID
      LEFT JOIN T_ADDRESS_ADR ADR ON CPD.ADR_ID = ADR.ADR_ID 
      LEFT JOIN correspondent_type ON CPD.correspondent_type_id = correspondent_type.id WHERE CPD_ID = ?`,
      [id],
    );

    const phone = await this.dataSource.query(
      `SELECT T_PHONE_PHO.PHO_ID as id,T_PHONE_PHO.PHO_NBR as number,T_PHONE_PHO.PHO_NBR as nbr, T_PHONE_TYPE_PTY.PTY_ID as phoneTypeId, T_PHONE_TYPE_PTY.PTY_NAME as phoneTypeName  FROM T_CORRESPONDENT_PHONE_CPP LEFT JOIN T_PHONE_PHO ON T_CORRESPONDENT_PHONE_CPP.PHO_ID = T_PHONE_PHO.PHO_ID LEFT JOIN T_PHONE_TYPE_PTY ON T_PHONE_PHO.PTY_ID = T_PHONE_TYPE_PTY.PTY_ID
WHERE CPD_ID = ?`,
      [id],
    );
    const results = correspondents.length > 0 ? correspondents[0] : null;
    results.civility = {
      id: results.GEN_ID,
      name: results.GEN_NAME,
      long_name: results.long_name,
      sex: results.GEN_TYPE,
    };
    results.address = {
      id: results.ADR_ID,
      street: results.ADR_STREET,
      street_comp: results.ADR_STREET_COMP,
      zip_code: results.ADR_ZIP_CODE,
      city: results.ADR_CITY,
      country: results.ADR_COUNTRY,
      country_code: results.ADR_COUNTRY_ABBR,
    };
    results.type = {
      id: results.typeId,
      name: results.typeName,
    };
    results.phones = phone;

    delete results.typeId;
    delete results.typeName;
    delete results.GEN_ID;
    delete results.GEN_NAME;
    delete results.long_name;
    delete results.GEN_TYPE;
    delete results.ADR_ID;
    delete results.ADR_STREET;
    delete results.ADR_STREET_COMP;
    delete results.ADR_ZIP_CODE;
    delete results.ADR_CITY;
    delete results.ADR_COUNTRY;
    delete results.ADR_COUNTRY_ABBR;

    return results;
  }

  async save(groupId: number, payload: CreateUpdateCorrespondentDto) {
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      let correspondentType = await queryRunner.manager
        .createQueryBuilder()
        .select(`CRT.id`)
        .from(CorrespondentTypeEntity, 'CRT')
        .where(`CRT.group_id = :groupId`, { groupId })
        .andWhere(`CRT.name = :typeName`, {
          typeName: payload?.type?.name,
        })
        .getRawOne();

      if (!correspondentType) {
        const insertCorrespondentType = await queryRunner.manager.query(
          `INSERT INTO correspondent_type (group_id, name)
                VALUES (?, ?)`,
          [groupId, payload?.type?.name],
        );
        correspondentType = insertCorrespondentType.insertId;
      } else {
        correspondentType = Object.values(correspondentType)[0];
      }

      if (!payload?.id) {
        const addressInsert = await queryRunner.manager.query(
          `INSERT INTO T_ADDRESS_ADR (ADR_STREET, ADR_STREET_COMP, ADR_ZIP_CODE, ADR_CITY, ADR_COUNTRY, ADR_COUNTRY_ABBR)
            VALUES (?, ?, ?, ?, ?, ?)`,
          [
            payload?.address?.street,
            payload?.address?.street_comp,
            payload?.address?.zip_code,
            payload?.address.city,
            payload?.address?.country,
            payload?.address?.country_code,
          ],
        );
        const newCorresponden = await queryRunner.manager.query(
          `INSERT INTO T_CORRESPONDENT_CPD (organization_id, GEN_ID, ADR_ID, correspondent_type_id, CPD_LASTNAME, CPD_FIRSTNAME, CPD_MAIL, CPD_MSG)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            groupId,
            payload?.civility?.id,
            addressInsert.insertId,
            correspondentType,
            payload?.lastname,
            payload?.firstname,
            payload?.email,
            payload?.description,
          ],
        );
        const mapPhone = payload?.phones.map((item) => {
          return {
            nbr: item.nbr,
            ptyId: item.phoneTypeId,
            type: item.type,
          };
        });
        const phoneIds = await this.phoneRepo.save(mapPhone);

        const arr = [];
        for (let i = 0; i < phoneIds.length; ++i) {
          arr.push(
            queryRunner.manager.query(
              `INSERT INTO T_CORRESPONDENT_PHONE_CPP (PHO_ID, CPD_ID)
                    VALUES (?, ?)`,
              [phoneIds?.[i].id, newCorresponden.insertId],
            ),
          );
        }
        await Promise.all(arr);
        await queryRunner.commitTransaction();
        return {
          ...payload,
          id: newCorresponden.insertId,
          address: { id: addressInsert.insertId, ...payload.address },
          phones: phoneIds.map(({ ptyId, type, ...rest }) => ({
            ...rest,
            number: rest.nbr,
            phoneTypeId: ptyId,
            type: type,
          })),
        };
      } else {
        const checkCorresponden = await queryRunner.manager.query(
          `SELECT * FROM T_CORRESPONDENT_CPD WHERE CPD_ID =?`,
          [payload?.id],
        );
        if (checkCorresponden.length === 0)
          throw new CBadRequestException(ErrorCode.NOT_FOUND);

        await queryRunner.manager.query(
          `UPDATE T_ADDRESS_ADR SET 
          ADR_STREET = ?,
          ADR_STREET_COMP = ?,
          ADR_ZIP_CODE = ?,
          ADR_CITY = ?,
          ADR_COUNTRY = ?,
          ADR_COUNTRY_ABBR = ? 
          WHERE ADR_ID = ?`,
          [
            payload?.address?.street,
            payload?.address?.street_comp,
            payload?.address?.zip_code,
            payload?.address.city,
            payload?.address?.country,
            payload?.address?.country_code,
            payload?.address?.id,
          ],
        );

        await queryRunner.manager.query(
          `UPDATE T_CORRESPONDENT_CPD SET
          GEN_ID = ?,
          correspondent_type_id = ?,
          CPD_LASTNAME = ?,
          CPD_FIRSTNAME = ?,
          CPD_MAIL = ?,
          CPD_MSG = ? WHERE CPD_ID = ?`,
          [
            payload?.civility.id,
            payload?.type.id,
            payload?.lastname,
            payload?.firstname,
            payload?.email,
            payload?.description,
            payload?.id,
          ],
        );

        await queryRunner.manager.query(
          ` DELETE T_PHONE_PHO
        FROM T_PHONE_PHO
        JOIN T_CORRESPONDENT_PHONE_CPP
        WHERE T_CORRESPONDENT_PHONE_CPP.CPD_ID = ?
          AND T_CORRESPONDENT_PHONE_CPP.PHO_ID = T_PHONE_PHO.PHO_ID`,
          [payload?.id],
        );

        const mapPhone = payload?.phones.map((item) => {
          return {
            nbr: item.nbr,
            ptyId: item.phoneTypeId,
            type: item.type,
          };
        });
        const phoneIds = await this.phoneRepo.save(mapPhone);

        const arr = [];
        for (let i = 0; i < phoneIds.length; ++i) {
          arr.push(
            queryRunner.manager.query(
              `INSERT INTO T_CORRESPONDENT_PHONE_CPP (PHO_ID, CPD_ID)
                    VALUES (?, ?)`,
              [phoneIds?.[i].id, payload?.id],
            ),
          );
        }
        await Promise.all(arr);

        await queryRunner.commitTransaction();
        return {
          ...payload,
          address: { ...payload.address },
          phones: phoneIds.map(({ ptyId, type, ...rest }) => ({
            ...rest,
            number: rest.nbr,
            phoneTypeId: ptyId,
            type: type,
          })),
        };
      }
    } catch {
      await queryRunner.rollbackTransaction();
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }
  }

  async findAllType(search: string) {
    const sql = await this.dataSource.query(
      `SELECT id, name FROM correspondent_type WHERE name LIKE ?`,
      [`%${search}%`],
    );
    return sql;
  }

  async findAllCorrespondents(
    groupId: number,
    search: string,
    page?: number,
    sort?: string,
  ) {
    const sql = await this.dataSource.query(
      `SELECT SQL_CALC_FOUND_ROWS
    CPD.CPD_ID AS id,
    CPD.CPD_ID AS DT_RowId,
    CPD.CPD_LASTNAME AS lastname,
    CPD.CPD_FIRSTNAME AS firstname,
    CPD.CPD_TYPE AS type,
    CPD.correspondent_type_id AS correspondent_type_id,
    correspondent_type.name as correspondentName,
    CONCAT_WS(' ', CPD.CPD_LASTNAME, CPD.CPD_FIRSTNAME) AS fullname,
    GROUP_CONCAT(DISTINCT PHO.PHO_NBR) AS phones
FROM T_CORRESPONDENT_CPD CPD
LEFT OUTER JOIN T_CORRESPONDENT_PHONE_CPP CPP ON CPP.CPD_ID = CPD.CPD_ID
LEFT OUTER JOIN T_PHONE_PHO PHO ON PHO.PHO_ID = CPP.PHO_ID
LEFT OUTER JOIN correspondent_type ON correspondent_type.id = CPD.correspondent_type_id
WHERE CPD.organization_id = ?
    AND (CPD.CPD_LASTNAME LIKE CONCAT(?, '%') OR CPD.CPD_FIRSTNAME LIKE CONCAT(?, '%') OR CPD.CPD_TYPE LIKE CONCAT(?, '%'))
    AND (CPD.correspondent_type_id IS NULL OR CPD.correspondent_type_id NOT IN (1,2))
GROUP BY CPD.CPD_ID ${sort}`,
      [groupId, search, search, search], // CPD.CPD_LASTNAME, CPD.CPD_FIRSTNAME ;
    );

    const offSet = (page - 1) * 100;
    const results = sql.slice(offSet, offSet + 100);

    const formatResults: findAllCorrRes[] = [];
    results.map((item) => {
      const { correspondent_type_id, correspondentName, phones, ...rest } =
        item;
      const corr = {
        ...rest,
        correspondent_type: {
          id: correspondent_type_id,
          name: correspondentName,
        },
        phones:
          phones === null
            ? [{ nbr: '' }]
            : phones.split(',').map((nbr) => ({ nbr })),
      };
      formatResults.push(corr);
    });
    return {
      data: formatResults,
      pageIndex: page,
      pageData: results.length,
      totalData: sql.length,
    };
  }

  async delete(userId: number, id: number) {
    const queryRunner = this.connection.createQueryRunner();
    const checkRoleDelete = await queryRunner.manager
      .createQueryBuilder()
      .select(`USR_PERMISSION_DELETE`)
      .from(UserEntity, 'USR')
      .where(`USR.USR_ID = :userId`, { userId })
      .getRawOne();
    if (checkRoleDelete.USR_PERMISSION_DELETE < 8)
      throw new CBadRequestException(ErrorCode.PERMISSION_DENIED);
    const correspondentDelete = await this.corresRepo.findOne({
      where: { id },
    });
    if (!correspondentDelete)
      throw new CBadRequestException(ErrorCode.NOT_FOUND_CORRESPONDENT);
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const queries = [
        `UPDATE T_LETTERS_LET SET CPD_ID = NULL WHERE CPD_ID = ?`,
        `UPDATE T_CONTACT_CON SET CPD_ID = NULL WHERE CPD_ID = ?`,
        `UPDATE T_CONTACT_CON SET CON_MEDECIN_TRAITANT = NULL WHERE CON_MEDECIN_TRAITANT = ?`,
        `UPDATE T_CORRESPONDENT_CPD CPD SET CPD.ADR_ID = NULL WHERE CPD.CPD_ID = ?`,
        `DELETE T_ADDRESS_ADR FROM T_ADDRESS_ADR JOIN T_CORRESPONDENT_CPD WHERE T_CORRESPONDENT_CPD.CPD_ID = ? AND T_CORRESPONDENT_CPD.ADR_ID = T_ADDRESS_ADR.ADR_ID`,
        `DELETE T_PHONE_PHO FROM T_PHONE_PHO JOIN T_CORRESPONDENT_PHONE_CPP WHERE T_CORRESPONDENT_PHONE_CPP.CPD_ID = ? AND T_CORRESPONDENT_PHONE_CPP.PHO_ID = T_PHONE_PHO.PHO_ID`,
        `DELETE T_CORRESPONDENT_PHONE_CPP FROM T_CORRESPONDENT_PHONE_CPP WHERE T_CORRESPONDENT_PHONE_CPP.CPD_ID = ?`,
        `DELETE T_CORRESPONDENT_CPD FROM T_CORRESPONDENT_CPD WHERE T_CORRESPONDENT_CPD.CPD_ID = ?`,
      ];
      let promises = [];
      promises = queries.map((query) => {
        return queryRunner.manager.query(query, [id]);
      });
      await Promise.all(promises);
      await queryRunner.commitTransaction();
      return correspondentDelete;
    } catch {
      await queryRunner.rollbackTransaction();
      throw new CBadRequestException(ErrorCode.STATUS_NOT_FOUND);
    } finally {
      await queryRunner.release();
    }
  }

  async getExportQuery(res: Response, id: number): Promise<any> {
    const patients = await this.dataSource.query(
      `SELECT T_CONTACT_CON.*, T_ADDRESS_ADR.*, GROUP_CONCAT(T_PHONE_PHO.PHO_NBR) AS phoneNumber_numbers  FROM T_CONTACT_CON LEFT JOIN T_ADDRESS_ADR ON T_CONTACT_CON.ADR_ID = T_ADDRESS_ADR.ADR_ID
LEFT JOIN T_PHONE_PHO ON T_CONTACT_CON.CON_ID = T_PHONE_PHO.PHO_ID 
WHERE T_CONTACT_CON.CPD_ID = ? GROUP BY T_CONTACT_CON.CON_ID ORDER BY T_CONTACT_CON.created_at DESC`,
      [id],
    );

    const rows = [];
    for (const patient of patients) {
      rows.push({
        lastname: patient?.CON_LASTNAME,
        firstname: patient?.CON_FIRSTNAME,
        number: patient?.CON_NBR,
        insee: inseeFormatter(`${patient?.CON_INSEE}${patient.CON_INSEE_KEY}`),
        email: patient?.CON_MAIL,
        date: dateFormatter(patient?.created_at),
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

    const fields = [
      { label: 'Numéro', value: 'number' },
      { label: 'Nom', value: 'lastname' },
      { label: 'Prénom', value: 'firstname' },
      { label: 'N° de Sécurité Sociale', value: 'insee' },
      { label: 'Email', value: 'email' },
      { label: 'Numéros de téléphone', value: 'phoneNumber_numbers' },
      { label: 'Adresse postale', value: 'address' },
      { label: 'Date de création du dossier', value: 'date' },
    ];
    const parser = new Parser({ fields });
    const data = parser.parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('patient.csv');
    res.status(200).send(data);
  }
}
