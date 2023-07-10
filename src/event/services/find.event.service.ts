import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';

import { BgEventDto, FindAllEventDto, MemoDto } from '../dto/findAll.event.dto';
import { ColorHelper } from 'src/common/util/color-helper';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import {
  HistoricalsDto,
  ReminderDto,
  TimeZoneDto,
} from '../dto/find.event.dto';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { FindEventByIdRes } from '../response/find.event.res';

const classNameFromStatuses: Map<number, string> = new Map<number, string>();
classNameFromStatuses.set(1, 'present');
classNameFromStatuses.set(2, 'absent');
classNameFromStatuses.set(3, 'canceled');
classNameFromStatuses.set(4, 'urgency');
classNameFromStatuses.set(5, 'completed');
classNameFromStatuses.set(6, 'completed');

@Injectable()
export class FindEventService {
  constructor(private readonly dataSource: DataSource) {}

  //ecoodentist-1.31.0\php\event\findAll.php
  async prepareSql(sql: string, value: string) {
    const result = await this.dataSource.query(sql, [value]);
    return result;
  }

  getPhoneNumberByContactId(arr, contactId: number): string | null {
    let previousPhoneNumber: string | null = null;
    const phoneNumber =
      arr.find((item) => {
        if (item.CON_ID === contactId) {
          if (previousPhoneNumber === null) {
            previousPhoneNumber = item.PHO_NBR;
          }
          return true;
        }
        return false;
      })?.PHO_NBR || previousPhoneNumber;

    return phoneNumber;
  }

  calculateAge(birthDate: string): string {
    if (!birthDate) {
      return '';
    }
    const birthDateObj = new Date(birthDate);
    const currentDate = new Date();
    const ageInMilliseconds = currentDate.getTime() - birthDateObj.getTime();

    const millisecondsInYear = 1000 * 60 * 60 * 24 * 365.25;
    const ageInYears = Math.floor(ageInMilliseconds / millisecondsInYear);

    const ageInMonths = Math.floor(
      (ageInMilliseconds % millisecondsInYear) /
        (1000 * 60 * 60 * 24 * 30.4375),
    );

    let ageString = '';
    if (ageInMonths === 0) {
      ageString = `${ageInYears} an`;
    } else {
      ageString = `${ageInMonths} mois`;
      if (ageInYears > 0) {
        ageString = `${ageInYears} an ${ageString}`;
      }
    }

    return ageString;
  }

  getPhoneNumber;

  getStartDay(date: string) {
    const modifiedDate = new Date(date);
    modifiedDate.setHours(0, 0, 0, 0);
    const year = modifiedDate.getFullYear();
    const month = String(modifiedDate.getMonth() + 1).padStart(2, '0');
    const day = String(modifiedDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  getEndDay(date: string) {
    const modifiedDate = new Date(date);
    modifiedDate.setDate(modifiedDate.getDate() + 1);

    const year = modifiedDate.getFullYear();
    const month = String(modifiedDate.getMonth() + 1).padStart(2, '0');
    const day = String(modifiedDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  async findAll(
    resources: number[],
    startDate: string,
    endDate: string,
    viewCancelledEvents: number,
    confidentiality: number,
  ) {
    const formattedResources = resources.map((item) => `'${item}'`).join(',');

    const sqlHome = await this.prepareSql(
      `SELECT T_PHONE_PHO.PHO_NBR,CON_ID
     FROM T_CONTACT_PHONE_COP
    JOIN T_PHONE_PHO
    JOIN T_PHONE_TYPE_PTY
    WHERE T_CONTACT_PHONE_COP.PHO_ID = T_PHONE_PHO.PHO_ID
    AND T_PHONE_PHO.PTY_ID = T_PHONE_TYPE_PTY.PTY_ID
    AND T_PHONE_TYPE_PTY.PTY_NAME = ?`,
      'home',
    );

    const sqlMobile = await this.prepareSql(
      `SELECT T_PHONE_PHO.PHO_NBR,CON_ID
     FROM T_CONTACT_PHONE_COP
    JOIN T_PHONE_PHO
    JOIN T_PHONE_TYPE_PTY
    WHERE T_CONTACT_PHONE_COP.PHO_ID = T_PHONE_PHO.PHO_ID
    AND T_PHONE_PHO.PTY_ID = T_PHONE_TYPE_PTY.PTY_ID
    AND T_PHONE_TYPE_PTY.PTY_NAME = ?`,
      'mobile',
    );
    const sqlSms = await this.prepareSql(
      `SELECT T_PHONE_PHO.PHO_NBR,CON_ID
     FROM T_CONTACT_PHONE_COP
    JOIN T_PHONE_PHO
    JOIN T_PHONE_TYPE_PTY
    WHERE T_CONTACT_PHONE_COP.PHO_ID = T_PHONE_PHO.PHO_ID
    AND T_PHONE_PHO.PTY_ID = T_PHONE_TYPE_PTY.PTY_ID
    AND T_PHONE_TYPE_PTY.PTY_NAME = ?`,
      'sms',
    );

    const result = await this.dataSource.query(
      `SELECT
        event_occurrence_evo.evo_id AS id,
        CONCAT_WS(' ', event_occurrence_evo.evo_date, TIME(T_EVENT_EVT.EVT_START)) AS start_date,
        CONCAT_WS(' ', event_occurrence_evo.evo_date, TIME(T_EVENT_EVT.EVT_END)) AS end_date,
        T_EVENT_EVT.EVT_NAME AS title,
        T_EVENT_EVT.EVT_MSG AS observation,
        T_EVENT_EVT.EVT_COLOR AS color,
        T_EVENT_EVT.EVT_STATE AS state,
        T_EVENT_EVT.lateness,
        DATE_FORMAT(T_EVENT_EVT.EVT_START, '%H:%i') AS startTime,
        DATE_FORMAT(T_EVENT_EVT.EVT_END, '%H:%i') AS endTime,
        DATE_FORMAT(T_EVENT_EVT.created_at, '%d/%m/%Y') AS creationDate,
        resource.id AS resourceId,
        resource.name AS resourceName,
        T_CONTACT_CON.CON_ID AS patientId,
        T_CONTACT_CON.CON_NBR AS number,
        T_CONTACT_CON.CON_LASTNAME AS lastName,
        T_CONTACT_CON.CON_FIRSTNAME AS firstName,
        T_CONTACT_CON.CON_BIRTHDAY AS birthDate,
        T_CONTACT_CON.CON_MAIL AS email,
        T_GENDER_GEN.GEN_NAME AS civilityTitle,
        MAX(T_REMINDER_RMD.RMD_FLAG) AS RMD_FLAG,
        T_REMINDER_TYPE_RMT.RMT_NAME,
        NULL AS homePhoneNumber,
        NULL AS mobilePhoneNumber,
        NULL AS smsPhoneNumber
    FROM T_EVENT_EVT
    JOIN event_occurrence_evo
    JOIN resource
    JOIN T_USER_USR
    LEFT OUTER JOIN T_CONTACT_CON ON T_CONTACT_CON.CON_ID = T_EVENT_EVT.CON_ID
    LEFT OUTER JOIN T_GENDER_GEN ON T_GENDER_GEN.GEN_ID = T_CONTACT_CON.GEN_ID
    LEFT OUTER JOIN T_REMINDER_RMD ON T_REMINDER_RMD.EVT_ID = T_EVENT_EVT.EVT_ID
    LEFT OUTER JOIN T_REMINDER_TYPE_RMT ON T_REMINDER_TYPE_RMT.RMT_ID = T_REMINDER_RMD.RMT_ID
    WHERE event_occurrence_evo.resource_id IN (${formattedResources})
      AND event_occurrence_evo.evo_date BETWEEN ? AND ?
      AND event_occurrence_evo.evo_exception = 0
      AND event_occurrence_evo.evt_id = T_EVENT_EVT.EVT_ID
      AND T_EVENT_EVT.EVT_DELETE = 0
      AND T_EVENT_EVT.resource_id =  resource.id
      AND T_EVENT_EVT.USR_ID = T_USER_USR.USR_ID
      AND CASE WHEN 0 = ? THEN T_EVENT_EVT.EVT_STATE NOT IN (2,3) ELSE 1 = 1 END
    GROUP BY event_occurrence_evo.evo_id
    ORDER BY start_date, end_date`,
      [startDate, endDate, viewCancelledEvents],
    );
    const events: FindAllEventDto[] = [];
    if (confidentiality === 0) {
      for (const item of result) {
        const colorArr = ColorHelper.inthex(Number(item.color));
        const newItem = {
          ...item,
          color: {
            background: colorArr[0],
            foreground: colorArr[1],
          },
          homePhoneNumber:
            item.patientId === null
              ? null
              : this.getPhoneNumberByContactId(sqlHome, item.patientId),
          mobilePhoneNumber:
            item.patientId === null
              ? null
              : this.getPhoneNumberByContactId(sqlMobile, item.patientId),
          smsPhoneNumber:
            item.patientId === null
              ? null
              : this.getPhoneNumberByContactId(sqlSms, item.patientId),
          age: this.calculateAge(item.birthDate),
          className:
            item.state === 0 ? null : classNameFromStatuses.get(item.state),
          resources: {
            id: item.resourceId,
            name: item.resourceName,
          },
        };

        events.push(newItem);
      }
    } else {
      for (const item of result) {
        const colorArr = ColorHelper.inthex(Number(item.color));
        const newItem = {
          ...item,
          color: {
            background: colorArr[0],
            foreground: colorArr[1],
          },
          lastName: null,
          firstName: null,
          number: null,
          civilityTitle: null,
          age: null,
          email: null,
          homePhoneNumber: null,
          mobilePhoneNumber: null,
          smsPhoneNumber: null,
        };
        events.push(newItem);
      }
    }

    const memos: MemoDto[] = await this.dataSource.query(
      `SELECT T_MEMO_MEM.MEM_ID as id, resource_id as resourceId, resource.name as resourceName,
      MEM_DATE as date FROM T_MEMO_MEM JOIN resource on T_MEMO_MEM.resource_id = resource.id 
      WHERE resource_id in (${formattedResources}) AND MEM_DATE BETWEEN ? AND ? 
      ORDER BY MEM_DATE ASC`,
      [startDate, endDate],
    );

    const bgevents: BgEventDto[] = await this.dataSource.query(
      `SELECT timeslot.id, resource_id as resourceId, resource.name as resourceName, start_date, 
      end_date, timeslot.color, title FROM timeslot JOIN resource ON timeslot.resource_id = resource.id 
      WHERE resource_id IN (${formattedResources}) and start_date >= ? AND end_date < ?
       ORDER BY start_date ASC, end_date ASC`,
      [this.getStartDay(startDate), this.getEndDay(endDate)],
    );

    return {
      events,
      bgevents,
      memos,
    };
  }

  async findById(doctorId: number, groupId: number, id: number) {
    try {
      await this.dataSource
        .createQueryBuilder()
        .select(`USP.USP_TIMEZONE`)
        .from(UserPreferenceEntity, 'USP')
        .where(`USP.USR_ID = :doctorId`, { doctorId })
        .getRawOne();

      const events: FindEventByIdRes[] = await this.dataSource.query(
        `SELECT
            evo.evo_id AS id,
            evo.evt_id AS eventId,
            EVT.EVT_NAME as name,
            CONCAT_WS(' ', evo.evo_date, TIME(EVT.EVT_START)) AS start,
            CONCAT_WS(' ', evo.evo_date, TIME(EVT.EVT_END)) AS end,
            EVT.EVT_MSG as msg,
            EVT.EVT_PRIVATE as private,
            EVT.EVT_COLOR as color,
            EVT.EVT_STATE as state,
            EVT.lateness,
            EVT.evt_rrule as rrule,
            EVT.created_at,
            IF (EVT.evt_rrule IS NOT NULL, 1, 0) as hasRecurrEvents,
            resource.id as resourceId,
            resource.name as resourceName,
			event_type.id as eventTypeId,
			event_type.label as eventTypeLabel,
            USR.USR_ID as practitionerId,
            USR.USR_LASTNAME as practitionerLastname,
            USR.USR_FIRSTNAME as practitionerFirstname,
            CON.CON_ID as contactId,
            CON.UPL_ID as avatar_id,
            CON.CON_NBR as contactNbr,
            CON.CON_LASTNAME as contactLastname,
            CON.CON_FIRSTNAME as contactFirstname,
            CON.CON_MAIL as contactEmail,
            (
                SELECT GROUP_CONCAT(evobis.evo_date)
                FROM event_occurrence_evo evobis
                WHERE evobis.evt_id = evo.evt_id
                  AND evobis.evo_exception = 0
            ) as dates,
            (
                SELECT GROUP_CONCAT(evobis.evo_date)
                FROM event_occurrence_evo evobis
                WHERE evobis.evt_id = evo.evt_id
                  AND evobis.evo_exception = 1
            ) as exdates
        FROM event_occurrence_evo evo
        JOIN T_EVENT_EVT EVT ON EVT.EVT_ID = evo.evt_id
        JOIN T_USER_USR USR ON USR.USR_ID = EVT.USR_ID AND USR.organization_id = ?
        LEFT OUTER JOIN resource ON resource.id = EVT.resource_id
        LEFT OUTER JOIN event_type ON event_type.id = EVT.event_type_id
        LEFT OUTER JOIN T_CONTACT_CON CON ON CON.CON_ID = EVT.CON_ID
        WHERE evo.evo_id = ?`,
        [groupId, id],
      );

      if (!events)
        throw new CNotFoundRequestException("Le rendez-vous n'existe pas.");

      let result: FindEventByIdRes = events.length > 0 ? events[0] : null;
      const formatColor = ColorHelper.inthex(result.color);
      result = {
        ...result,
        backgroundColor: formatColor[0],
        textColor: formatColor[1],
      };
      // TODO
      // if (result.avatar_id) {
      //   result.avatar_url = `php/contact/avatar.php?id=${result.contactId}`;
      // }
      if (result.avatar_id) {
        result.avatar_url = '';
      }

      const reminders: ReminderDto[] = await this.dataSource.query(
        `SELECT
            RMD.RMD_ID as id,
            RMD.appointment_reminder_library_id,
            RMD.RMD_NBR as nbr,
            RMT.RMT_ID as reminderTypeId,
            RMT.RMT_NAME as reminderTypeName,
            RMR.RMR_ID as reminderReceiverId,
            RMR.RMR_NAME as reminderReceiverName,
            RMU.RMU_ID as reminderUnitId,
            RMU.RMU_NAME as reminderUnitName,
            RMU.RMU_NBR as reminderUnitNbr
        FROM T_REMINDER_RMD RMD
        LEFT OUTER JOIN T_REMINDER_TYPE_RMT RMT ON RMT.RMT_ID = RMD.RMT_ID
        LEFT OUTER JOIN T_REMINDER_RECEIVER_RMR RMR ON RMR.RMR_ID = RMD.RMR_ID
        LEFT OUTER JOIN T_REMINDER_UNIT_RMU RMU ON RMU.RMU_ID = RMD.RMU_ID
        WHERE RMD.EVT_ID = ?`,
        [result.eventId],
      );

      const historicals: HistoricalsDto[] = await this.dataSource.query(
        `SELECT
            EHT.EHT_ID as id,
            EHT.EHT_MSG as msg,
            EHT.EHT_PREVIOUS as xml,
            EHT.created_at as createdOn,
            USR.USR_ID as userId,
            USR.USR_LASTNAME as userLastname,
            USR.USR_FIRSTNAME as userFirstname
        FROM T_EVENT_HISTORY_EHT EHT
        LEFT OUTER JOIN T_USER_USR USR ON USR.USR_ID = EHT.USR_ID
        WHERE EHT.EVT_ID = ?
        ORDER BY EHT.created_at DESC`,
        [result.eventId],
      );

      result = { ...result, reminders, historicals };

      return result;
    } catch (err) {
      return err;
    }
  }

  /**
   * File php/event/next.php
   * Line 14 -> 50
   */
  async getNextEvent(contact: number, start: string) {
    const nextQuery = `
    SELECT
        evo.evo_id id,
        EVT.EVT_NAME name,
        EVT.CON_ID as contacId,
        CONCAT_WS(' ', evo.evo_date, TIME(EVT.EVT_START)) start,
        CONCAT_WS(' ', evo.evo_date, TIME(EVT.EVT_END)) end,
        EVT.EVT_COLOR color,
        EVT.EVT_STATE AS status,
        EVT.EVT_ID eventId,
        USR.USR_ID practitionerId,
        USR.USR_ABBR practitionerAbbr,
        CONCAT_WS(' ', USR.USR_LASTNAME, USR.USR_FIRSTNAME) practitionerName,
        resource.id resourceId,
        resource.name resourceName
    FROM T_EVENT_EVT EVT
    JOIN event_occurrence_evo evo ON evo.evt_id = EVT.EVT_ID
    JOIN resource ON resource.id = EVT.resource_id
    JOIN T_USER_USR USR ON USR.USR_ID = EVT.USR_ID
    LEFT OUTER JOIN T_CONTACT_CON CON ON CON.CON_ID = EVT.CON_ID
    WHERE EVT.CON_ID = ?
      AND EVT.EVT_DELETE = 0
      AND evo.evo_date >= DATE(?)
      AND evo.evo_exception = 0
    ORDER BY start, end`;
    const result = await this.dataSource.query(nextQuery, [contact, start]);
    return result;
  }

  /**
   * File php/event/previous.php
   * Line 14 -> 50
   */
  async getPreviousEvent(contact: number, end: string) {
    const previousQuery = `
    SELECT
        evo.evo_id id,
        EVT.CON_ID as contacId,
        EVT.EVT_NAME name,
        CONCAT_WS(' ', evo.evo_date, TIME(EVT.EVT_START)) start,
        CONCAT_WS(' ', evo.evo_date, TIME(EVT.EVT_END)) end,
        EVT.EVT_COLOR color,
        EVT.EVT_STATE AS status,
        EVT.EVT_ID eventId,
        USR.USR_ID practitionerId,
        USR.USR_ABBR practitionerAbbr,
        CONCAT_WS(' ', USR.USR_LASTNAME, USR.USR_FIRSTNAME) practitionerName,
        resource.id resourceId,
        resource.name resourceName
    FROM T_EVENT_EVT EVT
    JOIN event_occurrence_evo evo ON evo.evt_id = EVT.EVT_ID
    JOIN resource ON resource.id = EVT.resource_id
    JOIN T_USER_USR USR ON USR.USR_ID = EVT.USR_ID
    LEFT OUTER JOIN T_CONTACT_CON CON ON CON.CON_ID = EVT.CON_ID
    WHERE EVT.CON_ID = ?
      AND EVT.EVT_DELETE = 0
      AND evo.evo_date < DATE(?)
      AND evo.evo_date != '0000-00-00'
      AND evo.evo_exception = 0
    ORDER BY start, end`;
    const result = await this.dataSource.query(previousQuery, [contact, end]);
    return result;
  }
}
