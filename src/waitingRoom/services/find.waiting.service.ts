import { Injectable } from '@nestjs/common';
import { colorHelper } from 'src/common/helper/ColorHelper';
import { ContactEntity } from 'src/entities/contact.entity';
import { EventOccurrenceEntity } from 'src/entities/event-occurrence.entity';
import { EventEntity } from 'src/entities/event.entity';
import { GenderEntity } from 'src/entities/gender.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { findAllWaitingQueryRes } from '../reponse/findAllWaiting.query.res';
import { findAllWaitingRes } from '../reponse/findAllWaiting.res';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class FindWaitingService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
    private dataSource: DataSource,
  ) {}

  /**
   * File: php\waitingRoom\findAll.php 21-99
   * @function main function
   *
   */
  async findAll(
    organizationID: number,
    userID: number,
    practitionerID: number,
  ) {
    const queryBuilder = this.dataSource.createQueryBuilder();
    const user = await this.userRepo.findOneBy({ id: organizationID });
    let query = '';
    if (
      user &&
      JSON.parse(JSON.stringify(user.settings))?.displayAllWaitingRooms
    ) {
      query = `T_USER_USR.organization_id = ${organizationID} AND EXISTS (
        SELECT *
        FROM T_PRIVILEGE_PVG
        WHERE T_PRIVILEGE_PVG.USR_ID = ${userID}
          AND T_PRIVILEGE_PVG.USR_WITH_ID = T_USER_USR.USR_ID
    ) `;
    } else {
      query = `T_USER_USR.USR_ID = ${practitionerID}`;
    }

    const select = `event_occurrence_evo.evo_id AS id,
    CONCAT_WS(' ', event_occurrence_evo.evo_date, TIME(T_EVENT_EVT.EVT_START)) AS start,
    CONCAT_WS(' ' , event_occurrence_evo.evo_date, TIME(T_EVENT_EVT.EVT_END)) AS end,
    T_EVENT_EVT.EVT_COLOR AS color,
    T_CONTACT_CON.CON_ID AS contactId,
    T_CONTACT_CON.CON_LASTNAME AS contactLastname,
    T_CONTACT_CON.CON_FIRSTNAME AS contactFirstname,
    T_USER_USR.USR_ID AS userId,
    T_USER_USR.USR_ABBR AS userShortName,
    T_USER_USR.USR_LASTNAME AS userLastName,
    T_USER_USR.USR_FIRSTNAME AS userFirstName,
    T_GENDER_GEN.GEN_NAME AS civilityTitleShortName`;

    const qr = queryBuilder
      .select(select)
      .from(EventEntity, 'T_EVENT_EVT')
      .innerJoin(EventOccurrenceEntity, 'event_occurrence_evo')
      .innerJoin(UserEntity, 'T_USER_USR')
      .innerJoin(ContactEntity, 'T_CONTACT_CON')
      .leftJoin(
        GenderEntity,
        'T_GENDER_GEN',
        'T_GENDER_GEN.GEN_ID = T_CONTACT_CON.GEN_ID',
      )
      .where(query)
      .andWhere('T_USER_USR.USR_ID = T_EVENT_EVT.USR_ID')
      .andWhere('T_EVENT_EVT.EVT_STATE = 1')
      .andWhere('T_EVENT_EVT.EVT_DELETE = 0')
      .andWhere('T_EVENT_EVT.EVT_ID = event_occurrence_evo.evt_id')
      .andWhere('event_occurrence_evo.evo_date = CURDATE()')
      .andWhere('event_occurrence_evo.evo_exception = 0')
      .andWhere('T_EVENT_EVT.CON_ID = T_CONTACT_CON.CON_ID')
      .addOrderBy('start, end', 'ASC');

    const events: findAllWaitingQueryRes[] = await qr.getRawMany();
    const result: findAllWaitingRes[] = events.map((event) => {
      const color = colorHelper.inthex(event.color);
      const civility_title = !event.civilityTitleShortName.length
        ? null
        : { short_name: event.civilityTitleShortName };

      return {
        color: {
          background: color[0],
          foreground: color[1],
        },
        patient: {
          id: event.contactId,
          last_name: event.contactLastname,
          first_name: event.contactFirstname,
          civility_title,
        },
        user: {
          id: event.userId,
          last_name: event.userLastName,
          first_name: event.userFirstName,
          short_name: event.userShortName,
        },
      };
    });

    return result;
  }
}
