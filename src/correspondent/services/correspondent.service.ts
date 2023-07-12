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
} from '../response/find.correspondent.res';

@Injectable()
export class CorrespondentService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly connection: Connection,
    @InjectRepository(PhoneEntity)
    private readonly phoneRepo: Repository<PhoneEntity>,
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
    results.phone = phone;

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
          phones: phoneIds.map(
            ({ createdAt, updatedAt, ptyId, type, ...rest }) => ({
              ...rest,
              number: rest.nbr,
              phoneTypeId: ptyId,
              type: type,
            }),
          ),
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
          phones: phoneIds.map(
            ({ createdAt, updatedAt, ptyId, type, ...rest }) => ({
              ...rest,
              number: rest.nbr,
              phoneTypeId: ptyId,
              type: type,
            }),
          ),
        };
      }
    } catch {
      await queryRunner.rollbackTransaction();
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }
  }
}
