import { Injectable, Logger } from '@nestjs/common';
import {
  ConditionItem,
  ReminderVisitCount,
  ReminderVisitItemDto,
  ReminderVisitPhone,
  ReminderVisitPrintQuery,
  ReminderVisitQuery,
} from '../dto/reminderVisit.dto';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import * as dayjs from 'dayjs';
import { ReminderVisitRes } from '../response/reminder-visit.res';
import { nl2br } from 'src/common/util/string';
import { UserEntity } from 'src/entities/user.entity';
import * as path from 'path';
import { createPdf } from '@saemhco/nestjs-html-pdf';
import {
  IReminderCondition,
  IReminderVisitDateConvert,
} from '../interface/reminder.visit.interface';

@Injectable()
export class ReminderVisitService {
  private readonly logger: Logger = new Logger(ReminderVisitService.name);
  constructor(
    @InjectRepository(UserPreferenceEntity)
    private readonly userPreferenceRepository: Repository<UserPreferenceEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private dataSource: DataSource,
  ) {}

  getQuery() {
    const query = `        (
        SELECT
            T_CONTACT_CON.CON_ID AS id,
            T_CONTACT_CON.CON_NBR AS number,
            T_CONTACT_CON.CON_LASTNAME AS lastname,
            T_CONTACT_CON.CON_FIRSTNAME AS firstname,
            T_CONTACT_CON.CON_MSG AS message,
            T_CONTACT_CON.CON_MAIL AS email,
            T_CONTACT_CON.CON_REMINDER_VISIT_LAST_DATE AS dateOfLastReminder,
            MAX(event_occurrence_evo.evo_date) AS dateOfLastVisit,
            T_CONTACT_CON.CON_REMINDER_VISIT_DATE AS dateOfNextReminder
        FROM T_CONTACT_CON
        LEFT OUTER JOIN T_EVENT_EVT ON T_EVENT_EVT.CON_ID = T_CONTACT_CON.CON_ID AND T_EVENT_EVT.EVT_DELETE = 0 AND T_EVENT_EVT.USR_ID = ?
        LEFT OUTER JOIN event_occurrence_evo ON event_occurrence_evo.evt_id = T_EVENT_EVT.EVT_ID AND event_occurrence_evo.evo_exception = 0
        WHERE T_CONTACT_CON.organization_id = ?
          AND T_CONTACT_CON.deleted_at IS NULL
          AND T_CONTACT_CON.CON_REMINDER_VISIT_TYPE = 'date'
        GROUP BY T_CONTACT_CON.CON_ID
    )
    UNION
    (
        SELECT
            T_CONTACT_CON.CON_ID AS id,
            T_CONTACT_CON.CON_NBR AS number,
            T_CONTACT_CON.CON_LASTNAME AS lastname,
            T_CONTACT_CON.CON_FIRSTNAME AS firstname,
            T_CONTACT_CON.CON_MSG AS message,
            T_CONTACT_CON.CON_MAIL AS email,
            T_CONTACT_CON.CON_REMINDER_VISIT_LAST_DATE AS dateOfLastReminder,
            MAX(t1.max_date) AS dateOfLastVisit,
            MAX(t1.max_date) + INTERVAL IF(
                T_CONTACT_CON.CON_REMINDER_VISIT_DURATION IS NULL OR T_CONTACT_CON.CON_REMINDER_VISIT_DURATION = 0,
                ?,
                T_CONTACT_CON.CON_REMINDER_VISIT_DURATION
            ) MONTH AS dateOfNextReminder
        FROM (
            (
                SELECT
                    T_CONTACT_CON.CON_ID AS id,
                    MAX(T_EVENT_TASK_ETK.ETK_DATE) AS max_date
                FROM T_CONTACT_CON
                JOIN T_EVENT_TASK_ETK
                WHERE T_CONTACT_CON.CON_REMINDER_VISIT_TYPE = 'duration'
                  AND T_CONTACT_CON.deleted_at IS NULL
                  AND T_CONTACT_CON.organization_id = ?
                  AND T_CONTACT_CON.CON_ID = T_EVENT_TASK_ETK.CON_ID
                  AND T_EVENT_TASK_ETK.USR_ID = ?
                GROUP BY T_CONTACT_CON.CON_ID
            )
            UNION
            (
                SELECT
                    T_CONTACT_CON.CON_ID AS id,
                    MAX(event_occurrence_evo.evo_date) AS max_date
                FROM T_CONTACT_CON
                JOIN T_EVENT_EVT
                JOIN event_occurrence_evo
                WHERE T_CONTACT_CON.CON_REMINDER_VISIT_TYPE = 'duration'
                  AND T_CONTACT_CON.deleted_at IS NULL
                  AND T_CONTACT_CON.organization_id = ?
                  AND T_CONTACT_CON.CON_ID = T_EVENT_EVT.CON_ID
                  AND T_EVENT_EVT.USR_ID = ?
                  AND T_EVENT_EVT.EVT_ID = event_occurrence_evo.evt_id
                GROUP BY T_CONTACT_CON.CON_ID
            )
        ) AS t1
        JOIN T_CONTACT_CON
        WHERE T_CONTACT_CON.CON_ID = t1.id
        GROUP BY t1.id
    )`;
    return query;
  }

  async getPhoneNumber(patientId: number): Promise<number> {
    const phoneQuery = `
    SELECT
    T_PHONE_PHO.PHO_NBR as phoneNumber
    FROM T_CONTACT_PHONE_COP
    JOIN T_PHONE_PHO
    JOIN T_PHONE_TYPE_PTY
    WHERE T_CONTACT_PHONE_COP.CON_ID = ?
      AND T_CONTACT_PHONE_COP.PHO_ID = T_PHONE_PHO.PHO_ID
      AND T_PHONE_PHO.PTY_ID = T_PHONE_TYPE_PTY.PTY_ID
      AND T_PHONE_TYPE_PTY.PTY_NAME = 'sms'
    LIMIT 1
      `;

    const phoneStatement: Array<ReminderVisitPhone> =
      await this.entityManager.query(phoneQuery, [patientId]);

    const phoneNumber = phoneStatement[0]?.phoneNumber || null;
    return phoneNumber;
  }

  async getListPhoneNumber(listId: number[]): Promise<ReminderVisitPhone[]> {
    const phoneQuery = `
    SELECT 
    T_PHONE_PHO.PHO_NBR as phoneNumber,
    T_CONTACT_PHONE_COP.CON_ID as conId
    FROM T_CONTACT_PHONE_COP
    JOIN T_PHONE_PHO
    JOIN T_PHONE_TYPE_PTY
    WHERE T_CONTACT_PHONE_COP.CON_ID IN (?)
      AND T_CONTACT_PHONE_COP.PHO_ID = T_PHONE_PHO.PHO_ID
      AND T_PHONE_PHO.PTY_ID = T_PHONE_TYPE_PTY.PTY_ID
      AND T_PHONE_TYPE_PTY.PTY_NAME = 'sms'
      `;
    if (listId.length === 0) {
      return [];
    }
    const phoneStatement: Array<ReminderVisitPhone> =
      await this.dataSource.query(phoneQuery, [listId]);
    return phoneStatement;
  }

  getConditions(conditions: Array<ConditionItem>): IReminderCondition {
    const fields = {
      'con.nbr': 'number',
      'con.lastname': 'lastname',
      'con.firstname': 'firstname',
      'con.reminderVisitLastDate': 'dateOfLastReminder',
      dateOfLastVisit: 'dateOfLastVisit',
      dateOfNextReminder: 'dateOfNextReminder',
    };

    const operators = {
      gte: '>=',
      lte: '<=',
      eq: '=',
      like: 'like',
    };
    const parameters = [];
    let where = '';
    const wheres = [];
    if (conditions) {
      for (const condition of conditions) {
        const field = fields[condition.field];
        const operator = operators[condition.op];
        // const value = `'${condition.value}'`;
        parameters.push(condition.value);
        wheres.push(`${field} ${operator} ?`);
      }
    }
    if (wheres.length) {
      where = `WHERE ${wheres.join(' AND ')}`;
    }
    return {
      where,
      parameters,
    };
  }

  async getReminderVisitDuration(userId: number): Promise<number> {
    const queryReminderVisitDuration =
      await this.userPreferenceRepository.findOne({
        select: {
          reminderVisitDuration: true,
        },
        where: {
          usrId: userId,
        },
      });
    return queryReminderVisitDuration.reminderVisitDuration;
  }

  formatReminderData(patient: ReminderVisitItemDto): IReminderVisitDateConvert {
    let dateOfLastVisit = patient.dateOfLastVisit;
    if (dateOfLastVisit) {
      dateOfLastVisit = dayjs(new Date(dateOfLastVisit)).format('DD/MM/YYYY');
    }

    let dateOfLastReminder = patient.dateOfLastReminder;
    if (dateOfLastReminder) {
      dateOfLastReminder = dayjs(new Date(dateOfLastReminder)).format(
        'DD/MM/YYYY',
      );
    }

    let dateOfNextReminder = patient.dateOfNextReminder;
    if (dateOfNextReminder) {
      dateOfNextReminder = dayjs(new Date(dateOfNextReminder)).format(
        'DD/MM/YYYY',
      );
    }
    return {
      dateOfLastVisit,
      dateOfLastReminder,
      dateOfNextReminder,
    };
  }

  async getAll(
    userId: number,
    group: number,
    params: ReminderVisitQuery,
  ): Promise<ReminderVisitRes> {
    const { user, conditions, page, rp } = params;
    const doctorId = user || userId;
    const groupId = group;
    const _page = page || 1;
    const length = rp || 50;
    const offset = (_page - 1) * length;

    // Récupération de la durée par défaut des rappels visites
    const duration = await this.getReminderVisitDuration(doctorId);
    const query = this.getQuery();

    // Conditions de la requête
    const { where, parameters } = this.getConditions(conditions);
    const countQuery = `
    SELECT COUNT(*) as total
    FROM (
        ${query}
    ) AS t1
    ${where}`;

    const countResult: Array<ReminderVisitCount> =
      await this.entityManager.query(countQuery, [
        doctorId,
        groupId,
        duration,
        groupId,
        doctorId,
        groupId,
        doctorId,
        ...parameters,
      ]);
    const total = countResult[0]?.total;

    const statement = `
      SELECT *
      FROM (
          ${query}
      ) AS t1
      ${where}
      ORDER BY t1.dateOfNextReminder
      LIMIT ${length}
      OFFSET ${offset}`;

    const results: Array<ReminderVisitItemDto> = await this.entityManager.query(
      statement,
      [
        doctorId,
        groupId,
        duration,
        groupId,
        doctorId,
        groupId,
        doctorId,
        ...parameters,
      ],
    );

    const response = []; // To store the final response
    const listIdPatient = results.map((item) => {
      return item?.id;
    });

    const listPhoneNumber = await this.getListPhoneNumber(listIdPatient);

    for (const patient of results) {
      const { dateOfLastVisit, dateOfLastReminder, dateOfNextReminder } =
        this.formatReminderData(patient);

      // Récupération du numéro de téléphone
      const phoneNumber = listPhoneNumber.find((item) => {
        return item?.conId === patient?.id;
      });

      const flexigridRow = {
        cell: [
          patient.id,
          patient.number,
          `${patient.lastname} ${patient.firstname}`,
          `<span data-type="textarea" data-pk="${patient.id}" data-value="${
            patient.message
          }">${nl2br(patient.message)}</span>`,
          patient.email,
          phoneNumber?.phoneNumber,
          dateOfLastVisit,
          dateOfLastReminder,
          dateOfNextReminder,
        ],
      };

      response.push(flexigridRow);
    }

    return {
      total: total * 1,
      page: _page * 1,
      rows: response,
    };
  }
  catch(ex) {
    this.logger.error(ex);
  }

  async print(userId: number, group: number, params: ReminderVisitPrintQuery) {
    const { user, conditions } = params;
    const doctorId = user || userId;
    const groupId = group;
    const duration = await this.getReminderVisitDuration(doctorId);
    const query = this.getQuery();

    const userEntity = await this.userRepository.findOne({
      where: { id: doctorId },
    });

    // Conditions de la requête
    const { where, parameters } = this.getConditions(conditions);

    const statement = `
      SELECT *
      FROM (
          ${query}
      ) AS t1
      ${where}
      ORDER BY t1.dateOfNextReminder
    `;

    const results: Array<ReminderVisitItemDto> = await this.entityManager.query(
      statement,
      [
        doctorId,
        groupId,
        duration,
        groupId,
        doctorId,
        groupId,
        doctorId,
        ...parameters,
      ],
    );
    const patients: ReminderVisitItemDto[] = [];
    for (const patient of results) {
      const { dateOfLastVisit, dateOfLastReminder, dateOfNextReminder } =
        this.formatReminderData(patient);
      const phoneNumber = await this.getPhoneNumber(patient.id);
      patients.push({
        ...patient,
        dateOfLastVisit,
        dateOfLastReminder,
        dateOfNextReminder,
        phone: phoneNumber,
      });
    }
    const options = {
      format: 'A4',
      displayHeaderFooter: true,
      headerTemplate: `<div  style="width:100%;margin-left:10mm"><span style="font-size: 10px;">
        <strong>Liste des rappels visites</strong>
        <div>Docteur ${userEntity.lastname} ${userEntity.firstname}</div>
      </div>`,
      footerTemplate: '<div></div>',
      margin: {
        left: '10mm',
        top: '20mm',
        right: '10mm',
        bottom: '15mm',
      },
    };
    const filePath = path.join(
      process.cwd(),
      'templates/pdf/contact',
      'reminder-visit.hbs',
    );

    const pdf = await createPdf(filePath, options, { patients });
    return pdf;
  }
}
