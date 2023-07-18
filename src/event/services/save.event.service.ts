import { Injectable } from '@nestjs/common';
import { SaveEventPayloadDto } from '../dto/save.event.dto';
import { Connection, DataSource, Repository } from 'typeorm';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { UserEntity } from 'src/entities/user.entity';
import { SaveAgendaDto } from '../dto/saveAgenda.event.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactEntity } from 'src/entities/contact.entity';
import dayjs from 'dayjs';
import { EventStateEnum } from 'src/constants/event';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { checkId } from 'src/common/util/number';

@Injectable()
export class SaveEventService {
  constructor(
    private readonly connection: Connection,
    private dataSource: DataSource,
    @InjectRepository(ContactEntity)
    private contactRepo: Repository<ContactEntity>,
  ) {}

  convertArrayToInteger(array: number[]): number {
    return array.reduce((acc, value) => acc | (1 << value), 0);
  }

  async save(id: number, payload: SaveEventPayloadDto) {
    const { settings, ...userPreferencePayload } = payload;

    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const selectSettings = await queryRunner.manager
        .createQueryBuilder()
        .select('settings')
        .from(UserEntity, 'USR')
        .where('USR_ID = :id', { id })
        .getRawOne();

      const formatSelectSetting = {
        eventTitleFormat: settings.eventTitleFormat,
        displayAllWaitingRooms: selectSettings.settings.displayAllWaitingRooms,
        printAdditionalPatientInformation:
          selectSettings.settings.printAdditionalPatientInformation,
        activateSendingAppointmentReminders:
          selectSettings.settings.activateSendingAppointmentReminders,
      };

      await queryRunner.manager
        .createQueryBuilder()
        .update(UserEntity)
        .set({ settings: formatSelectSetting })
        .where('USR_ID = :id', { id })
        .execute();

      const updateResult = await queryRunner.manager
        .createQueryBuilder()
        .update(UserPreferenceEntity)
        .set({
          usrId: userPreferencePayload.id,
          language: userPreferencePayload.language,
          country: userPreferencePayload.country,
          timezone: userPreferencePayload.timezone,
          view: userPreferencePayload.view,
          days: this.convertArrayToInteger(userPreferencePayload.days),
          weekStartDay: userPreferencePayload.weekStartDay,
          displayHoliday: userPreferencePayload.displayHoliday,
          displayEventTime: userPreferencePayload.displayEventTime,
          displayLastPatients: userPreferencePayload.displayLastPatients,
          displayPractitionerCalendar:
            userPreferencePayload.displayPractitionerCalendar,
          enableEventPractitionerChange:
            userPreferencePayload.enableEventPractitionerChange,
          frequency: userPreferencePayload.frequency,
          hmd: userPreferencePayload.hmd,
          hmf: userPreferencePayload.hmf,
          had: userPreferencePayload.had,
          haf: userPreferencePayload.haf,
          heightLine: userPreferencePayload.heightLine,
          quotationDisplayOdontogram:
            userPreferencePayload.quotationDisplayOdontogram,
          quotationDisplayDetails:
            userPreferencePayload.quotationDisplayDetails,
          quotationDisplayTooltip:
            userPreferencePayload.quotationDisplayTooltip,
          quotationDisplayDuplicata:
            userPreferencePayload.quotationDisplayDuplicata,
          quotationColor: userPreferencePayload.quotationColor,
          billDisplayTooltip: userPreferencePayload.billDisplayTooltip,
          billTemplate: userPreferencePayload.billTemplate,
          orderDisplayTooltip: userPreferencePayload.orderDisplayTooltip,
          orderDuplicata: userPreferencePayload.orderDuplicata,
          orderPreprintedHeader: userPreferencePayload.orderPreprintedHeader,
          orderPreprintedHeaderSize:
            userPreferencePayload.orderPreprintedHeaderSize,
          orderFormat: userPreferencePayload.orderFormat,
          orderBcbCheck: userPreferencePayload.orderBcbCheck,
          themeCustom: userPreferencePayload.themeCustom,
          themeColor: userPreferencePayload.themeColor,
          themeBgcolor: userPreferencePayload.themeBgcolor,
          themeBordercolor: userPreferencePayload.themeBordercolor,
          themeAsideBgcolor: userPreferencePayload.themeAsideBgcolor,
          reminderVisitDuration: userPreferencePayload.reminderVisitDuration,
          ccamBridgeQuickentry: userPreferencePayload.ccamBridgeQuickentry,
          ccamPriceList: userPreferencePayload.ccam_price_list,
          patientCareTime: userPreferencePayload.patient_care_time,
          calendarBorderColored: userPreferencePayload.calendar_border_colored,
        })
        .where('USR_ID = :id', { id })
        .execute();

      await queryRunner.commitTransaction();
      return updateResult.raw;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // file php/event/save.php full file
  // create and update calendar
  async saveAgenda(userId: number, payload: SaveAgendaDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const {
      id,
      name,
      start,
      end,
      state,
      lateness,
      msg,
      color,
      rrule,
      hasRecurrEvents,
      scp,
      practitionerId,
      resourceId,
      contactId,
      reminders,
    } = payload;
    let eventId = payload.eventId;
    const eventTypeId = payload.eventTypeId === '' ? null : payload.eventTypeId;
    const _private = payload.private;
    const dates = payload.dates ? payload.dates.split(',') : [];
    const exdates = payload.exdates ? payload.exdates.split(',') : [];

    let eventStatus = 0;
    let eventLateness = 0;
    try {
      const countStatement: { count: number } = await queryRunner.query(
        `
      SELECT COUNT(*) as count
        FROM T_CONTACT_CON
        WHERE CON_ID = ?
          AND deleted_at IS NOT NULL`,
        [contactId],
      );
      if (countStatement.count === 0) {
        throw new CBadRequestException(
          `Le patient a été supprimé. Veuillez restaurer le patient avant de créer / modifier un rendez-vous.`,
        );
      }

      if (!id) {
        await queryRunner.query(
          `INSERT INTO T_EVENT_EVT (resource_id, USR_ID, CON_ID, event_type_id, EVT_NAME, EVT_START, EVT_END, EVT_MSG, EVT_PRIVATE, EVT_COLOR, EVT_STATE, lateness, evt_rrule)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            resourceId,
            practitionerId,
            contactId,
            eventTypeId,
            name,
            start,
            end,
            msg,
            _private,
            color,
            state,
            lateness,
            rrule,
          ],
        );
        const result = await queryRunner.query(
          'SELECT LAST_INSERT_ID() AS lastInsertId',
        );
        eventId = result[0].lastInsertId;
        if (!Number(hasRecurrEvents)) {
          // Nouvelle occurrence pour DATE(start)
          await queryRunner.query(
            `INSERT INTO event_occurrence_evo (evt_id, resource_id, evo_date)
          VALUES (?, ?, DATE(?))`,
            [eventId, resourceId, start],
          );
        } else if (dates.length === 0) {
          throw new Error(`Une récurrence doit posséder au moins une date.`);
        } else {
          const promiseArr = [];
          for (const date of dates) {
            if (date) {
              promiseArr.push(
                queryRunner.query(
                  `
              INSERT INTO event_occurrence_evo (evt_id, resource_id, evo_date)
              VALUES (?, ?, ?)`,
                  [eventId, resourceId, date],
                ),
              );
            }
          }
          for (const exdate of exdates) {
            if (exdate) {
              promiseArr.push(
                queryRunner.query(
                  `
              INSERT INTO event_occurrence_evo (evt_id, resource_id, evo_date)
              VALUES (?, ?, ?)`,
                  [eventId, resourceId, exdate],
                ),
              );
            }
          }
          const totalBatch = Math.ceil(promiseArr.length / 100);
          for (let i = 0; i < totalBatch; i++) {
            const batch = promiseArr.splice(0, 100);
            await Promise.all(batch);
          }
        }
      } else {
        const eventStatement = await queryRunner.query(
          `
        SELECT
                EVT_STATE AS status,
                lateness
            FROM T_EVENT_EVT
            WHERE EVT_ID = ?`,
          [eventId],
        );
        eventStatus = eventStatement[0].status;
        eventLateness = eventStatement[0].lateness;

        if (!hasRecurrEvents) {
          await Promise.all([
            queryRunner.query(
              `
            UPDATE T_EVENT_EVT
                SET resource_id = ?,
                    USR_ID = ?,
                    CON_ID = ?,
                    event_type_id = ?,
                    EVT_NAME = ?,
                    EVT_START = ?,
                    EVT_START_TZ = 'UTC',
                    EVT_END = ?,
                    EVT_END_TZ = 'UTC',
                    EVT_MSG = ?,
                    EVT_PRIVATE = ?,
                    EVT_COLOR = ?,
                    EVT_STATE = ?,
                    lateness = ?
                WHERE EVT_ID = ?`,
              [
                resourceId,
                practitionerId,
                contactId,
                eventTypeId,
                name,
                start,
                end,
                msg,
                _private,
                color,
                state,
                lateness,
                eventId,
              ],
            ),
            queryRunner.query(
              `
            UPDATE event_occurrence_evo
            SET resource_id = ?,
                evo_date = DATE(?)
            WHERE evo_id = ?`,
              [resourceId, start, id],
            ),
          ]);
        } else {
          if (scp === 'all') {
            await Promise.all([
              queryRunner.query(
                `
              UPDATE T_EVENT_EVT
                    SET resource_id = ?,
                        USR_ID = ?,
                        CON_ID = ?,
                        event_type_id = ?,
                        EVT_NAME = ?,
                        EVT_MSG = ?,
                        EVT_PRIVATE = ?,
                        EVT_COLOR = ?,
                        EVT_STATE = ?,
                        lateness = ?
                    WHERE EVT_ID = ?`,
                [
                  resourceId,
                  practitionerId,
                  contactId,
                  eventTypeId,
                  name,
                  msg,
                  _private,
                  color,
                  state,
                  lateness,
                  eventId,
                ],
              ),
              queryRunner.query(
                `
              UPDATE event_occurence_evo
                    SET resource_id = ?
                    WHERE evt_id = ?`,
                [resourceId, eventId],
              ),
            ]);
          } else if (scp === 'tail') {
            const occurrenceStatement: { evo_date: string }[] =
              await queryRunner.query(
                `
            SELECT
                        evo_date
                    FROM event_occurrence_evo
                    WHERE evt_id = ?
                      AND evo_date >= DATE(?)
                      AND evo_exception = 0`,
                [eventId, start],
              );
            const dates = occurrenceStatement.map((date) => date.evo_date);

            await Promise.all([
              queryRunner.query(
                `
              UPDATE event_occurrence_evo
              SET evo_exception = 1
              WHERE evt_id = ?
                AND evo_date >= DATE(?)
                AND evo_exception = 0`,
                [eventId, start],
              ),
              queryRunner.query(
                `
                INSERT INTO T_EVENT_EVT (resource_id, USR_ID, CON_ID, event_type_id, EVT_NAME, EVT_START, EVT_END, EVT_MSG, EVT_PRIVATE, EVT_COLOR, EVT_STATE, lateness, evt_rrule)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  resourceId,
                  practitionerId,
                  contactId,
                  eventTypeId,
                  name,
                  start,
                  end,
                  msg,
                  _private,
                  color,
                  state,
                  lateness,
                  rrule,
                ],
              ),
            ]);

            const result = await queryRunner.query(
              'SELECT LAST_INSERT_ID() AS lastInsertId',
            );
            eventId = result[0].lastInsertId;
            const promiseArr = [];
            for (const date of dates) {
              promiseArr.push(
                queryRunner.query(
                  `
              INSERT INTO event_occurrence_evo (evt_id, resource_id, evo_date)
                        VALUES (?, ?, ?)`,
                  [eventId, resourceId, date],
                ),
              );
            }
            const totalBatch = Math.ceil(promiseArr.length / 100);
            for (let i = 0; i < totalBatch; i++) {
              const batch = promiseArr.splice(0, 100);
              await Promise.all(batch);
            }
          } else {
            await Promise.all([
              queryRunner.query(
                `UPDATE event_occurrence_evo
              SET evo_exception = 1
              WHERE evo_id = ?`,
                [id],
              ),
              queryRunner.query(
                `
              INSERT INTO T_EVENT_EVT (resource_id, USR_ID, CON_ID, event_type_id, EVT_NAME, EVT_START, EVT_END, EVT_MSG, EVT_PRIVATE, EVT_COLOR, EVT_STATE, lateness, evt_rrule)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
                [
                  resourceId,
                  practitionerId,
                  contactId,
                  eventTypeId,
                  name,
                  start,
                  end,
                  msg,
                  _private,
                  color,
                  state,
                  lateness,
                ],
              ),
            ]);
            const result = await queryRunner.query(
              'SELECT LAST_INSERT_ID() AS lastInsertId',
            );
            eventId = result[0].lastInsertId;
            await queryRunner.query(
              `
            INSERT INTO event_occurrence_evo (evt_id, resource_id, evo_date)
                    VALUES (?, ?, DATE(?))`,
              [eventId, resourceId, start],
            );
          }
        }
      }

      // Historique En retard
      if (contactId && lateness && eventLateness === 0) {
        const date = dayjs(start).format('DD-MM-YYYY');
        // @TODO translate
        //   $message = trans("Patient en retard au rendez-vous du %datetime%", [
        //     '%datetime%' => $formatter->format($datetime)
        // ]);
        const message = `Patient en retard au rendez-vous du ${date}`;
        queryRunner.query(
          `INSERT INTO T_CONTACT_NOTE_CNO (user_id, CON_ID, CNO_DATE, CNO_MESSAGE)
        VALUES (?, ?, CURRENT_TIMESTAMP, ?)`,
          [practitionerId, contactId, message],
        );
      }

      // nouvelle notification pour les rendez-vous présent
      if (
        userId !== Number(practitionerId) &&
        contactId &&
        Number(state) !== eventStatus &&
        Number(state) === EventStateEnum.PRESENT
      ) {
        const patient = await this.contactRepo.findOneBy({
          id: Number(contactId),
        });
        await queryRunner.query(
          `
        INSERT INTO notification (user_id, notification_operation_id, item_id, title, body)
            VALUES (?, 2, ?, ?, ?)`,
          [
            practitionerId,
            eventId,
            dayjs(start).format('DD-MM-YYYY HH:mm'),
            `Le patient ${patient.lastname} ${patient.firstname} est en salle d'attente`,
          ],
        );
      }

      /**
       * GESTION DES RAPPELS
       */

      // Suppression de tous les rappels
      if (Object.keys(reminders).length === 0) {
        await queryRunner.query(
          `
        DELETE FROM T_REMINDER_RMD
            WHERE EVT_ID = ?`,
          [eventId],
        );
      } else {
        // Insertion / modification des rappels
        const reminderIds: number[] = reminders.map((reminder) =>
          Number(reminder.id),
        );
        reminderIds.push(0);
        const inQuery: string = Array(reminderIds.length).fill('?').join(',');

        await queryRunner.query(
          `
        DELETE FROM T_REMINDER_RMD
            WHERE EVT_ID = ?
              AND RMD_ID NOT IN (${inQuery})`,
          [eventId, ...reminderIds],
        );

        const promiseArr = [];
        for (const reminder of reminders) {
          const reminderId = checkId(reminder?.id);
          const reminderNbr = reminder['nbr'];
          const reminderTypeId = checkId(reminder?.reminderTypeId);
          const reminderReceiverId = checkId(reminder?.reminderReceiverId);
          const reminderUnitId = checkId(reminder?.reminderUnitId);
          const appointmentReminderLibraryId = checkId(
            reminder?.appointment_reminder_library_id,
          );

          promiseArr.push(
            queryRunner.query(
              `
          INSERT INTO T_REMINDER_RMD (RMD_ID, USR_ID, EVT_ID, RMT_ID, RMR_ID, RMU_ID, appointment_reminder_library_id, RMD_NBR)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                USR_ID = VALUES(USR_ID),
                RMT_ID = VALUES(RMT_ID),
                RMR_ID = VALUES(RMR_ID),
                RMU_ID = VALUES(RMU_ID),
                appointment_reminder_library_id = VALUES(appointment_reminder_library_id),
                RMD_NBR = VALUES(RMD_NBR)`,
              [
                reminderId,
                practitionerId,
                eventId,
                reminderTypeId,
                reminderReceiverId,
                reminderUnitId,
                appointmentReminderLibraryId,
                reminderNbr,
              ],
            ),
          );
        }
        await Promise.all(promiseArr);
      }
      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      return new CBadRequestException(ErrorCode.SAVE_FAILED);
    } finally {
      await queryRunner.release();
    }
  }
}
