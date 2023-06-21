import { Injectable } from '@nestjs/common';
import { AddressEntity } from 'src/entities/address.entity';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { ContactEntity } from 'src/entities/contact.entity';
import { EventEntity } from 'src/entities/event.entity';
import { GenderEntity } from 'src/entities/gender.entity';
import { PhoneEntity } from 'src/entities/phone.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import {
  FindAllContactDto,
  FindAllStructDto,
} from '../dto/findAll.contact.dto';
import { FindAllContactRes } from '../response/findall.contact.res';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import {
  contactPhoneRes,
  FindAllRecentlyTreatedRes,
} from '../response/findall.recentlyTreated.res';
import { ColorHelper } from 'src/utils/ColorHelper';

@Injectable()
export class FindContactService {
  private operators = [
    'like',
    'not like',
    '<',
    '<=',
    '=',
    '!=',
    '>=',
    '>',
    'is null',
    'is not null',
  ];

  private fields = {
    lastname: 'CON.CON_LASTNAME',
    firstname: 'CON.CON_FIRSTNAME',
    number: 'CON.CON_NBR',
    inseeNumber: 'CON.CON_INSEE',
    email: 'CON.CON_MAIL',
    birthDate: 'CON.CON_BIRTHDAY',
    phoneNumber: 'PHO.PHO_NBR',
    zipCode: 'ADR.ADR_ZIP_CODE',
    city: 'ADR.ADR_CITY',
  };

  constructor(private dataSource: DataSource) {}

  // Convert function from application\Services\SearchCriteria.php
  addWhere(
    qr: SelectQueryBuilder<ContactUserEntity>,
    conditions: FindAllStructDto[],
  ) {
    const noNeedAddParam = ['is null', 'is not null'];
    for (const condition of conditions) {
      if (this.operators.indexOf(condition.op) > -1) {
        let query = ``;
        if (noNeedAddParam.indexOf(condition.op) > -1) {
          qr.andWhere(`${this.fields[condition.field]} ${condition.op}`);
        } else {
          query = `${this.fields[condition.field]} ${condition.op} :con`;
          qr.andWhere(query, {
            con: condition.value,
          });
        }
      }
    }
    return qr;
  }
  /**
   * File: php\contact\findAll.php 21-91
   * @function main function
   *
   */
  async findAll(
    request: FindAllContactDto,
    docterId: number,
    organizationId: number,
  ): Promise<FindAllContactRes[]> {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `
            CON.CON_ID as id,
            CON.CON_ID as DT_RowId,
            CON.CON_ID as value,
            CON.CON_NBR as nbr,
            CON.CON_LASTNAME as lastname,
            CON.CON_FIRSTNAME as firstname,
           CON.CON_BIRTHDAY as birthday,
            CON.CON_MSG as msg,
            CON.CON_INSEE as insee_number,
            CON.CON_INSEE_KEY as insee_number_key,
            CON.CON_COLOR as color,
            CONCAT_WS(' ', T_GENDER_GEN.GEN_NAME, CON_LASTNAME, CON_FIRSTNAME) as label,
            GROUP_CONCAT(DISTINCT PHO.PHO_NBR) as phones,
            cou.cou_amount_due as amountDue,
            USR.USR_ID as practitionerId,
            USR.USR_ABBR as practitionerAbbr,
            USR.USR_LASTNAME as practitionerLastname,
            USR.USR_FIRSTNAME as practitionerFirstname`;
    const qr = queryBuiler
      .select(select)
      .from(ContactEntity, 'CON')
      .leftJoin(UserEntity, 'USR', 'USR.USR_ID = CON.USR_ID')
      .leftJoin(AddressEntity, 'ADR', 'ADR.ADR_ID = CON.ADR_ID')
      .leftJoin('T_CONTACT_PHONE_COP', 'COP', 'COP.CON_ID = CON.CON_ID')
      .leftJoin(PhoneEntity, 'PHO', 'PHO.PHO_ID = COP.PHO_ID')
      .leftJoin(
        ContactUserEntity,
        'cou',
        `cou.con_id = CON.CON_ID AND cou.usr_id = :docterId`,
        {
          docterId,
        },
      )
      .leftJoin(
        GenderEntity,
        'T_GENDER_GEN',
        'T_GENDER_GEN.GEN_ID = CON.GEN_ID',
      );
    // Start $searchCriteria = new \App\Services\SearchCriteria($connection, $fields, $conditions);
    if (request.conditions && request.conditions.length > 0) {
      this.addWhere(qr, request.conditions);
    }
    // end $searchCriteria = new \App\Services\SearchCriteria($connection, $fields, $conditions);
    qr.andWhere('CON.organization_id = :id', {
      id: organizationId,
    });
    qr.addGroupBy('CON.CON_ID');
    qr.addOrderBy('CON.CON_LASTNAME , CON.CON_FIRSTNAME', 'ASC');
    const contacts: FindAllContactRes[] = await qr.getRawMany();

    const conIds = contacts.map((a) => a.id);

    /**
     * Logic in php\contact\findAll.php line 34 and line 79->82
     */
    if (conIds && conIds.length > 0) {
      const reliabilityQr = this.dataSource
        .createQueryBuilder()
        .from(EventEntity, 'EVT');

      reliabilityQr.select(
        `COALESCE(100 * SUM(IF(lateness = 0 AND EVT.EVT_STATE NOT IN (2, 3), 1, 0)) / COUNT(EVT_ID), 0) as reliability, EVT.CON_ID as conId`,
      );
      reliabilityQr.andWhere(
        'EVT.CON_ID IN (:conIds) AND EVT.USR_ID = :docterId AND EVT.EVT_DELETE = 0',
        {
          conIds: conIds.join(','),
          docterId,
        },
      );
      reliabilityQr.addGroupBy('EVT.CON_ID');

      const reliabilities: {
        reliability: number;
        conId: number;
      }[] = await reliabilityQr.getRawMany();

      const allContacts = contacts.map((contact) => {
        const reliability = reliabilities.find((r) => r.conId === contact.id);
        contact.reliability = 0;
        if (reliability) {
          contact.reliability = reliability.reliability;
        }
        return contact;
      });
      return allContacts;
    }
    return contacts;
  }

  /**
   * File: php\contact\recentlyTreated\findAll.php 14->77
   */
  async findAllRecentlyTreated(
    practitioner?: number,
  ): Promise<FindAllRecentlyTreatedRes[]> {
    const reliabilityQueryBuilder = this.dataSource.createQueryBuilder();
    reliabilityQueryBuilder
      .select(
        'COALESCE(100 * SUM(IF(lateness = 0 AND EVT.EVT_STATE NOT IN (2, 3), 1, 0)) / COUNT(*), 0) as reliability',
      )
      .from(EventEntity, 'EVT')
      .where('EVT.CON_ID = :conId')
      .andWhere('EVT.USR_ID = :usrId')
      .andWhere('EVT.EVT_DELETE = 0');

    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `
      CON.CON_ID as id,
      CON.CON_ID as DT_RowId,
      CON.CON_ID as value,
      CON.CON_NBR as nbr,
      CON.CON_LASTNAME as lastname,
      CON.CON_FIRSTNAME as firstname,
      CON.CON_BIRTHDAY as birthday,
      CON.CON_MSG as msg,
          CON.CON_COLOR as color,
      CONCAT_WS(' ', CON_LASTNAME, CON_FIRSTNAME) as label,
      GROUP_CONCAT(DISTINCT PHO.PHO_NBR) as phones,
      cou.cou_amount_due as amountDue,
      USR.USR_ID as practitionerId,
      USR.USR_ABBR as practitionerAbbr,
      USR.USR_LASTNAME as practitionerLastname,
      USR.USR_FIRSTNAME as practitionerFirstname`;

    const qr = queryBuiler
      .select(select)
      .addFrom((qb) => {
        return qb
          .select('ETK.CON_ID as id, ETK.ETK_ID as position')
          .from(EventTaskEntity, 'ETK')
          .where('ETK.USR_ID = :id', {
            id: practitioner,
          })
          .andWhere('ETK.ETK_DATE <= CURDATE()')
          .andWhere('ETK.CON_ID IS NOT NULL')
          .orderBy('ETK.ETK_DATE', 'DESC')
          .addOrderBy('ETK.ETK_ID', 'DESC')
          .limit(50);
      }, 'tmp')
      .innerJoin(ContactEntity, 'CON')
      .leftJoin(
        ContactUserEntity,
        'cou',
        'cou.con_id = CON.CON_ID AND cou.usr_id = :id',
        {
          id: practitioner,
        },
      )
      .leftJoin(UserEntity, 'USR', 'USR.USR_ID = CON.USR_ID')
      .leftJoin('T_CONTACT_PHONE_COP', 'COP', 'COP.CON_ID = CON.CON_ID')
      .leftJoin(PhoneEntity, 'PHO', 'PHO.PHO_ID = COP.PHO_ID')
      .where('tmp.id = CON.CON_ID')
      .andWhere('CON.deleted_at IS NULL')
      .groupBy('tmp.id')
      .orderBy('tmp.position', 'DESC');

    const results = await qr.getRawMany();

    const resPromise: Promise<FindAllRecentlyTreatedRes>[] = results.map(
      async (item) => {
        // convert phones
        const pArr: contactPhoneRes[] = String(item.phones)
          .split(',')
          .map((item) => {
            return {
              nbr: item,
            };
          });

        // convert color
        const colorArr = ColorHelper.inthex(Number(item.color));

        // get reliability
        reliabilityQueryBuilder.setParameters({
          conId: item.id,
          usrId: practitioner,
        });
        const reliability = await reliabilityQueryBuilder
          .getRawOne()
          .then((result) => {
            return result.reliability;
          });

        const tmp: FindAllRecentlyTreatedRes = {
          ...item,
          color: {
            background: colorArr[0],
            foreground: colorArr[1],
          },
          phones: pArr,
          reliability: reliability,
        };
        return tmp;
      },
    );

    const recentlyTreatedArr = await Promise.all(resPromise);
    const response = recentlyTreatedArr.map((result) => result);

    return response;
  }
}
