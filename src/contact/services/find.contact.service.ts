import { Injectable } from '@nestjs/common';
import { ContactEntity } from 'src/entities/contact.entity';
import { DataSource } from 'typeorm';
import { FindAllContactDto } from '../dto/findAll.contact.dto';
import { FindAllContactRes } from '../response/findall.contact.res';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { UserEntity } from 'src/entities/user.entity';
import { PhoneEntity } from 'src/entities/phone.entity';
import {
  contactPhoneRes,
  FindAllRecentlyTreatedRes,
} from '../response/findall.recentlyTreated.res';
import { ColorHelper } from 'src/utils/ColorHelper';
import { EventEntity } from 'src/entities/event.entity';

@Injectable()
export class FindContactService {
  constructor(private dataSource: DataSource) {}

  /**
   * File: php\contact\findAll.php 21-91
   * @function main function
   *
   */
  async findAll(
    request: FindAllContactDto,
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
            CON.CON_COLOR as color`;
    const qr = queryBuiler.select(select).from(ContactEntity, 'CON');
    if (request.conditions && request.conditions[0].field) {
      qr.where('CON.CON_LASTNAME like :name', {
        name: request.conditions[0].value,
      });
    }
    qr.where('CON.CON_ID <> :id', {
      id: organizationId,
    });
    const ab: FindAllContactRes[] = await qr.getRawMany();
    for (const a of ab) {
      if (a.phones) {
        // Check and create phome number from data
      }
      /*
      $reliabilityStm->execute(array($record['id'], $practitionerId));
      $record['reliability'] = $reliabilityStm->fetchColumn();
      $reliabilityStm->closeCursor();
      */
      a.reliability = 1;
    }
    return ab;
  }

  /**
   * File: php\contact\recentlyTreated\findAll.php 14->77
   */
  async recentlyTreated(
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
