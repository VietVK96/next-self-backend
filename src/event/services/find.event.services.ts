import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ColorHelper } from 'src/utils/ColorHelper';
import { FindAllEventDto } from '../dto/findAll.event.dto';

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

  async prepareSql(sql: string, key: number, value: string) {
    const result = await this.dataSource.query(sql, [key, value]);
    const resultFormat = result.length === 0 ? null : result[0].PHO_NBR;
    return resultFormat;
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

    const sqlHome = `SELECT T_PHONE_PHO.PHO_NBR
    FROM T_CONTACT_PHONE_COP
    JOIN T_PHONE_PHO
    JOIN T_PHONE_TYPE_PTY
    WHERE T_CONTACT_PHONE_COP.CON_ID = ? AND
    T_CONTACT_PHONE_COP.PHO_ID = T_PHONE_PHO.PHO_ID
      AND T_PHONE_PHO.PTY_ID = T_PHONE_TYPE_PTY.PTY_ID
      AND T_PHONE_TYPE_PTY.PTY_NAME = ?
    LIMIT 1`;

    const sqlMobile = `SELECT T_PHONE_PHO.PHO_NBR
     FROM T_CONTACT_PHONE_COP
    JOIN T_PHONE_PHO
    JOIN T_PHONE_TYPE_PTY
    WHERE T_CONTACT_PHONE_COP.CON_ID = ?
    AND T_CONTACT_PHONE_COP.PHO_ID = T_PHONE_PHO.PHO_ID
    AND T_PHONE_PHO.PTY_ID = T_PHONE_TYPE_PTY.PTY_ID
    AND T_PHONE_TYPE_PTY.PTY_NAME = ?
    LIMIT 1`;

    const sqlSms = `SELECT T_PHONE_PHO.PHO_NBR
     FROM T_CONTACT_PHONE_COP
    JOIN T_PHONE_PHO
    JOIN T_PHONE_TYPE_PTY
    WHERE T_CONTACT_PHONE_COP.CON_ID = ?
    AND T_CONTACT_PHONE_COP.PHO_ID = T_PHONE_PHO.PHO_ID
    AND T_PHONE_PHO.PTY_ID = T_PHONE_TYPE_PTY.PTY_ID
    AND T_PHONE_TYPE_PTY.PTY_NAME = ?
    LIMIT 1`;

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
              : await this.prepareSql(sqlHome, item.patientId, 'home'),
          mobilePhoneNumber:
            item.patientId === null
              ? null
              : await this.prepareSql(sqlMobile, item.patientId, 'mobile'),
          smsPhoneNumber:
            item.patientId === null
              ? null
              : await this.prepareSql(sqlSms, item.patientId, 'sms'),
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

    const memos = await this.dataSource.query(
      `SELECT T_MEMO_MEM.MEM_ID as id, resource_id as resourceId, resource.name as resourceName,
      MEM_DATE as date FROM T_MEMO_MEM JOIN resource on T_MEMO_MEM.resource_id = resource.id 
      WHERE resource_id in (${formattedResources}) AND MEM_DATE BETWEEN ? AND ? 
      ORDER BY MEM_DATE ASC`,
      [startDate, endDate],
    );

    const bgevents = await this.dataSource.query(
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
}
