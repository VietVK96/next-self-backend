import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SyncGoogleResult } from '../dto/google.dto';
import * as dayjs from 'dayjs';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class JobsService {
  constructor(
    private readonly datasource: DataSource,
    private config: ConfigService,
  ) {}
  private readonly logger = new Logger(JobsService.name);

  @Cron(CronExpression.EVERY_MINUTE)
  async googleCalendar() {
    // Bug from when run mutiple instance. All cron need this condition
    const isRunCron = this.config.get<boolean>('app.isRunCron');
    if (!isRunCron) {
      return;
    }
    //
    await this.datasource.query('SET @TRIGGER_CHECKS = FALSE');
    const syncGoogleUserRows = `
    SELECT SGU.SGU_TOKEN as syncGoogleUserToken,
      SGU.SGU_ACCESS_TOKEN as syncGoogleUserAccessToken,
      SGU.SGU_CALENDAR_ID as syncGoogleUserCalendarId,
      SGU.SGU_LAST_MODIFIED as syncGoogleUserLastModified,
      SGU.SGU_GOOGLE_LAST_MODIFIED as syncGoogleUserGoogleLastModified,
      USR.USR_ID as userId,
      USR.organization_id as groupId,
      USR.resource_id as resourceId,
      USP.USP_TIMEZONE as timezone
    FROM T_SYNC_GOOGLE_USER_SGU SGU
    JOIN T_USER_USR USR ON USR.USR_ID = SGU.USR_ID
    JOIN T_LICENSE_LIC LIC ON LIC.USR_ID = USR.USR_ID
    JOIN T_USER_PREFERENCE_USP USP ON USP.USR_ID = USR.USR_ID
    WHERE SGU.SGU_ACTIVATED_ON < CURDATE()
      AND SGU.SGU_ACCESS_TOKEN IS NOT NULL
      AND SGU.SGU_ACCESS_TOKEN != ''
      AND SGU.SGU_TOKEN IS NOT NULL
      AND SGU.SGU_TOKEN != ''
      AND ((USR.USR_CLIENT BETWEEN 1 AND 4) OR LIC.LIC_END >= CURDATE())`;
    const syncGoogleResult: SyncGoogleResult[] = await this.datasource.query(
      syncGoogleUserRows,
    );
    for (const syncGoogleUserRow of syncGoogleResult) {
      const syncGoogleUserToken = syncGoogleUserRow?.syncGoogleUserToken;
      const syncGoogleUserAccessToken =
        syncGoogleUserRow?.syncGoogleUserAccessToken;
      const syncGoogleUserCalendarId =
        syncGoogleUserRow?.syncGoogleUserCalendarId;
      const syncGoogleUserLastModified =
        syncGoogleUserRow?.syncGoogleUserLastModified;
      let syncGoogleUserLastModifiedAsString;
      let syncGoogleUserGoogleLastModified =
        syncGoogleUserRow?.syncGoogleUserGoogleLastModified;
      const userId = syncGoogleUserRow?.userId;
      const userTimezone = syncGoogleUserRow?.timezone;
      const groupId = syncGoogleUserRow?.groupId;
      const resourceId = syncGoogleUserRow?.resourceId;
      const appointmentCollection = [];

      if (syncGoogleUserLastModified) {
        syncGoogleUserLastModifiedAsString = dayjs(
          syncGoogleUserLastModified,
        ).format('YYYY-MM-DD HH:mm:ss');
      }

      const statement = `SELECT SUBTIME(CURRENT_TIMESTAMP(), '00:00:01') as time`;
      const lastModifiedRes = await this.datasource.query(statement);
      let lastModified = lastModifiedRes[0]?.time;
      await this.datasource.query('SET @groupid = ?', [groupId]);

      try {
        const GOOGLE_CLIENT_ID = this.config.get<string>(
          'app.googleCalendar.clientId',
        );
        const GOOGLE_CLIENT_SECRET = this.config.get<string>(
          'app.googleCalendar.clientSecret',
        );
        const client = this.config.get<string>('app.googleCalendar.clientSide');

        const oauth2Client = new google.auth.OAuth2(
          GOOGLE_CLIENT_ID,
          GOOGLE_CLIENT_SECRET,
          client,
        );

        oauth2Client.setCredentials({
          refresh_token: syncGoogleUserToken,
          access_token: syncGoogleUserAccessToken,
          scope: 'https://www.googleapis.com/auth/calendar',
        });
        const service = google.calendar({ version: 'v3', auth: oauth2Client });
        const parameters = [userId];

        let query = `
         SELECT EVT.EVT_ID as appointmentId,
                  CONCAT_WS(' ', evo.evo_date, TIME(EVT.EVT_START)) as appointmentBegin,
                  CONCAT_WS(' ', evo.evo_date, TIME(EVT.EVT_END)) as appointmentEnd,
                  EVT.EVT_DELETE as appointmentDeleted,
                  CONCAT_WS(' ', CONCAT('[', CON.CON_LASTNAME, ' ', CON.CON_FIRSTNAME, ']'), EVT.EVT_NAME) as nameText,
                  CONCAT_WS('\n', CON.CON_MAIL, GROUP_CONCAT('\n', CONCAT('[', PTY.PTY_NAME, ']', ' ', PHO.PHO_NBR)), EVT.EVT_MSG) as messageText,
                  CONCAT_WS(' ', ADR.ADR_STREET, ADR.ADR_STREET_COMP, ADR.ADR_ZIP_CODE, ADR.ADR_CITY, ADR.ADR_COUNTRY) as addressText,
                  SGE.SGE_ID as syncGoogleEventId,
                  SGE.SGE_GOOGLE_EVENT_ID as googleEventId
          FROM event_occurrence_evo evo
          JOIN T_EVENT_EVT EVT
          LEFT OUTER JOIN T_SYNC_GOOGLE_EVENT_SGE SGE ON SGE.EVT_ID = EVT.EVT_ID
          LEFT OUTER JOIN T_CONTACT_CON CON ON CON.CON_ID = EVT.CON_ID
          LEFT OUTER JOIN T_CONTACT_PHONE_COP COP ON COP.CON_ID = CON.CON_ID
          LEFT OUTER JOIN T_PHONE_PHO PHO ON PHO.PHO_ID = COP.PHO_ID
          LEFT OUTER JOIN T_PHONE_TYPE_PTY PTY ON PTY.PTY_ID = PHO.PTY_ID
          LEFT OUTER JOIN T_ADDRESS_ADR ADR ON ADR.ADR_ID = CON.ADR_ID
          WHERE EVT.USR_ID = ?
            AND EVT.EVT_START IS NOT NULL
            AND EVT.EVT_END IS NOT NULL
            AND EVT.EVT_ID = evo.evt_id`;
        if (syncGoogleUserLastModifiedAsString) {
          query =
            query +
            ` AND EVT.updated_at >= ?
          AND(
            SGE.last_modified IS NULL OR
						SGE.last_modified != EVT.updated_at
          )`;
          parameters.push(syncGoogleUserLastModifiedAsString);
        } else {
          query =
            query +
            ` AND evo.evo_date >= CURDATE()
          AND EVT.EVT_DELETE = 0`;
        }

        query = query + ' GROUP BY EVT.EVT_ID';
        const appointmentRows = await this.datasource.query(query, parameters);
        for (const appointmentRow of appointmentRows) {
          const appointmentId = appointmentRow?.appointmentId;
          const appointmentEnd = dayjs(appointmentRow?.appointmentEnd);
          const appointmentBegin = dayjs(appointmentRow?.appointmentBegin);
          const appointmentDeleted = appointmentRow?.appointmentDeleted;
          const eventSummary = appointmentRow?.nameText;
          const eventDescription = appointmentRow?.messageText;
          const eventLocation = appointmentRow?.addressText;
          let syncGoogleEventId = appointmentRow?.syncGoogleEventId;
          let googleEventId = appointmentRow?.googleEventId;
          try {
            if (appointmentDeleted) {
              if (googleEventId) {
                await service.events.delete({
                  calendarId: syncGoogleUserCalendarId,
                  eventId: googleEventId,
                });
                const syncGoogleEventUpdateParamters = [syncGoogleEventId];
                await this.datasource.query(
                  `
                DELETE FROM T_SYNC_GOOGLE_EVENT_SGE
                WHERE SGE_ID = ?`,
                  syncGoogleEventUpdateParamters,
                );
                this.logger.debug(
                  `Suppression du rendez - vous Google ${googleEventId}`,
                  syncGoogleUserCalendarId,
                );
              }
            } else {
              let googleEventUpdatedText;
              if (googleEventId) {
                try {
                  const calendarEventEntry = await service.events.get({
                    calendarId: syncGoogleUserCalendarId,
                    eventId: googleEventId,
                  });
                  const resUpdate = await service.events.update({
                    calendarId: syncGoogleUserCalendarId,
                    eventId: calendarEventEntry?.data?.id,
                    requestBody: {
                      ...calendarEventEntry?.data,
                      summary: eventSummary,
                      description: eventDescription,
                      location: eventLocation,
                      start: {
                        dateTime: appointmentBegin.toISOString(),
                      },
                      end: {
                        dateTime: appointmentEnd.toISOString(),
                      },
                    },
                  });
                  googleEventUpdatedText = dayjs(
                    resUpdate?.data?.updated,
                  ).format('YYYY-MM-DD HH:mm:ss');
                  this.logger.debug(
                    `Modification du rendez-vous Google ${googleEventId} `,
                    syncGoogleUserCalendarId,
                  );
                } catch (error) {
                  const calendarEventEntry = {
                    summary: eventSummary,
                    description: eventDescription,
                    location: eventLocation,
                    start: {
                      dateTime: appointmentBegin.toISOString(),
                    },
                    end: {
                      dateTime: appointmentEnd.toISOString(),
                    },
                  };
                  const newGoogleEventEntry = await service.events.insert({
                    calendarId: syncGoogleUserCalendarId,
                    requestBody: {
                      ...calendarEventEntry,
                    },
                  });
                  googleEventUpdatedText = dayjs(
                    newGoogleEventEntry?.data?.updated,
                  ).format('YYYY-MM-DD HH:mm:ss');
                  googleEventId = newGoogleEventEntry.data.id;
                  this.logger.debug(
                    `Insertion du rendez-vous Google ${googleEventId}`,
                    syncGoogleUserCalendarId,
                  );
                }
              } else {
                const calendarEventEntry = {
                  summary: eventSummary,
                  description: eventDescription,
                  location: eventLocation,
                  start: {
                    dateTime: appointmentBegin.toISOString(),
                    timeZone: userTimezone,
                  },
                  end: {
                    dateTime: appointmentEnd.toISOString(),
                    timeZone: userTimezone,
                  },
                };
                const newGoogleEventEntry = await service.events.insert({
                  calendarId: syncGoogleUserCalendarId,
                  requestBody: {
                    ...calendarEventEntry,
                  },
                });
                googleEventUpdatedText = dayjs(
                  newGoogleEventEntry?.data?.updated,
                ).format('YYYY-MM-DD HH:mm:ss');
                googleEventId = newGoogleEventEntry.data.id;
                this.logger.debug(
                  `Insertion du rendez-vous Google ${googleEventId}: ` +
                    syncGoogleUserCalendarId,
                );
                const syncGoogleEventUpdateParamters = [
                  appointmentId,
                  googleEventId,
                ];
                const resInsertGoogleEvent = await this.datasource.query(
                  `
                 INSERT INTO T_SYNC_GOOGLE_EVENT_SGE (EVT_ID, SGE_GOOGLE_EVENT_ID)
                  VALUES (?, ?)`,
                  syncGoogleEventUpdateParamters,
                );
                syncGoogleEventId = resInsertGoogleEvent?.insertId;
              }

              appointmentCollection.push(googleEventId);
              const syncGoogleEventUpdateParamters = [
                googleEventId,
                googleEventUpdatedText,
                syncGoogleEventId,
              ];
              await this.datasource.query(
                `
              UPDATE T_SYNC_GOOGLE_EVENT_SGE
              SET SGE_GOOGLE_EVENT_ID = ?,
                  SGE_GOOGLE_EVENT_UPDATE = ?,
                  SGE_GOOGLE_EVENT_DELETE_COUNTER = 0,
                  SGE_SOURCE = 'ecoo'
              WHERE SGE_ID = ?`,
                syncGoogleEventUpdateParamters,
              );
            }
          } catch (error) {
            this.logger.error(
              'An error has occurred during synchronization ',
              error,
            );
          }
        }
        await this.datasource.query(
          `
        UPDATE T_SYNC_GOOGLE_USER_SGU
        SET SGU_LAST_MODIFIED = ?
        WHERE USR_ID = ?`,
          [lastModified, userId],
        );
        let numberOfAppointmentTreaty = 0;
        const listEventsParameters = {
          orderBy: 'updated',
          showDeleted: true,
          timeMin: dayjs().toISOString(),
          singleEvents: true,
        };
        if (dayjs(syncGoogleUserGoogleLastModified).isValid()) {
          const currentTime = dayjs().subtract(30, 'day');
          const syncGoogleUserGoogleLastModifiedTime = dayjs(
            syncGoogleUserGoogleLastModified,
          );
          listEventsParameters['updatedMin'] =
            currentTime.diff(syncGoogleUserGoogleLastModifiedTime) > 0
              ? currentTime.toISOString()
              : syncGoogleUserGoogleLastModifiedTime.toISOString();
        }

        let calendarEventFeed;
        let resCalendar;
        try {
          resCalendar = await service.events.list({
            calendarId: syncGoogleUserCalendarId,
            ...listEventsParameters,
          });
          calendarEventFeed = resCalendar?.data?.items;
        } catch (error) {
          if (error?.code === 410) {
            const modifyDateTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
            const syncGoogleUserUpdateParameters = [modifyDateTime, userId];
            await this.datasource.query(
              `
            UPDATE T_SYNC_GOOGLE_USER_SGU
            SET SGU_GOOGLE_LAST_MODIFIED = ?
            WHERE USR_ID = ?`,
              syncGoogleUserUpdateParameters,
            );
          }
          throw error;
        }

        if (!resCalendar?.data) {
          this.logger.error(
            'Echec lors de la récupération des rendez-vous Google.' +
              syncGoogleUserCalendarId,
          );
        } else {
          while (true) {
            for (const calendarEventEntry of calendarEventFeed) {
              try {
                const googleEventId = calendarEventEntry?.id;
                const googleEventSummary = calendarEventEntry?.summary;
                const googleEventDescription = calendarEventEntry?.description;
                const googleEventStatus = calendarEventEntry?.status;
                const googleEventCanceled = /cancelled$/i.test(
                  googleEventStatus,
                );
                let googleEventStart = calendarEventEntry?.start;
                let googleEventEnd = calendarEventEntry?.end;
                if (googleEventStart) {
                  const googleEventStartDateTime = googleEventStart?.dateTime;
                  if (!googleEventStartDateTime) {
                    continue;
                  }
                  googleEventStart = dayjs(googleEventStartDateTime).format(
                    'YYYY-MM-DD HH:mm:ss',
                  );
                }

                if (googleEventEnd) {
                  const googleEventEndDateTime = googleEventEnd?.dateTime;
                  if (!googleEventEndDateTime) {
                    continue;
                  }
                  googleEventEnd = dayjs(googleEventEndDateTime).format(
                    'YYYY-MM-DD HH:mm:ss',
                  );
                }

                const googleEventUpdatedAsString = dayjs(
                  calendarEventEntry?.updated,
                ).format('YYYY-MM-DD HH:mm:ss');
                syncGoogleUserGoogleLastModified =
                  dayjs(googleEventUpdatedAsString).diff(
                    syncGoogleUserGoogleLastModified,
                  ) > 0
                    ? googleEventUpdatedAsString
                    : syncGoogleUserGoogleLastModified;
                if (appointmentCollection.includes(googleEventId)) {
                  continue;
                } else {
                  numberOfAppointmentTreaty += 1;
                }
                const parameters = [googleEventId];
                const stmt = await this.datasource.query(
                  `
                SELECT SGE.SGE_ID as syncGoogleEventId,
                        SGE.EVT_ID as eventId,
                        SGE.SGE_GOOGLE_EVENT_UPDATE as syncGoogleEventUpdate
                FROM T_SYNC_GOOGLE_EVENT_SGE SGE
                WHERE SGE.SGE_GOOGLE_EVENT_ID = ?`,
                  parameters,
                );
                const syncGoogleEventRow = stmt[0];
                if (!syncGoogleEventRow) {
                  if (!googleEventCanceled) {
                    const appointmentRes = await this.datasource.query(
                      `
                    INSERT INTO T_EVENT_EVT (resource_id, USR_ID, EVT_NAME, EVT_START, EVT_START_TZ, EVT_END, EVT_END_TZ, EVT_MSG, created_by)
                    VALUES (?, ?, ?, ?, 'UTC', ?, 'UTC', ?, 'google')`,
                      [
                        resourceId,
                        userId,
                        googleEventSummary,
                        googleEventStart,
                        googleEventEnd,
                        googleEventDescription,
                      ],
                    );
                    const appointmentId = appointmentRes?.insertId;
                    await this.datasource.query(
                      `
                    INSERT INTO event_occurrence_evo (evt_id, resource_id, evo_date)
                    VALUES (?, ?, DATE(?))`,
                      [appointmentId, resourceId, googleEventStart],
                    );
                    const lastModifiedStatement = await this.datasource.query(
                      `
                    SELECT
											event.updated_at
										FROM T_EVENT_EVT event
										WHERE EVT_ID = ?`,
                      [appointmentId],
                    );
                    lastModified = lastModifiedStatement[0]?.updated_at;
                    await this.datasource.query(
                      `
                    INSERT INTO T_SYNC_GOOGLE_EVENT_SGE (EVT_ID, SGE_GOOGLE_EVENT_ID, SGE_GOOGLE_EVENT_UPDATE, SGE_SOURCE, last_modified)
										VALUES (?, ?, ?, 'google', ?)`,
                      [
                        appointmentId,
                        googleEventId,
                        googleEventUpdatedAsString,
                        lastModified,
                      ],
                    );
                    this.logger.debug(
                      `Insertion du rendez-vous #${appointmentId} ` +
                        syncGoogleUserCalendarId,
                    );
                  }
                } else {
                  const syncGoogleEventId =
                    syncGoogleEventRow?.syncGoogleEventId;
                  const syncGoogleEventUpdate =
                    syncGoogleEventRow?.syncGoogleEventUpdate;
                  const appointmentId = syncGoogleEventRow?.eventId;
                  if (
                    dayjs(googleEventUpdatedAsString).diff(
                      syncGoogleEventUpdate,
                    ) > 0
                  ) {
                    if (!googleEventCanceled) {
                      await this.datasource.query(
                        `
                      UPDATE T_EVENT_EVT
                      SET EVT_START = ?,
                          EVT_START_TZ = 'UTC',
                          EVT_END = ?,
                          EVT_END_TZ = 'UTC'
                      WHERE EVT_ID = ?`,
                        [googleEventStart, googleEventEnd, appointmentId],
                      );

                      await this.datasource.query(
                        `
                      UPDATE event_occurrence_evo
                      SET evo_date = DATE(?)
                      WHERE evt_id = ?`,
                        [googleEventStart, appointmentId],
                      );
                      const lastModifiedStatement = await this.datasource.query(
                        `
                      SELECT
												T_EVENT_EVT.updated_at
											FROM T_EVENT_EVT
											WHERE EVT_ID = ?`,
                        [appointmentId],
                      );
                      lastModified = lastModifiedStatement[0]?.updated_at;

                      await this.datasource.query(
                        `
                      UPDATE T_SYNC_GOOGLE_EVENT_SGE
                      SET SGE_GOOGLE_EVENT_UPDATE = ?,
                          SGE_SOURCE = 'google',
                          last_modified = ?
                      WHERE SGE_ID = ?`,
                        [
                          googleEventUpdatedAsString,
                          lastModified,
                          syncGoogleEventId,
                        ],
                      );

                      this.logger.debug(
                        `Modification du rendez-vous #${appointmentId}`,
                        syncGoogleUserCalendarId,
                      );
                    } else {
                      await this.datasource.query(
                        `
                      UPDATE T_EVENT_EVT
                      SET EVT_DELETE = 1
                      WHERE EVT_ID = ?`,
                        [appointmentId],
                      );

                      await this.datasource.query(
                        `
                      DELETE FROM T_SYNC_GOOGLE_EVENT_SGE
                      WHERE SGE_ID = ?`,
                        [syncGoogleEventId],
                      );

                      this.logger.debug(
                        `Suppression du rendez-vous #${appointmentId}`,
                        syncGoogleUserCalendarId,
                      );
                    }
                  }
                }
              } catch (error) {
                this.logger.error(
                  `An error has occurred during synchronization`,
                  syncGoogleUserCalendarId,
                );
              }
            }

            try {
              const pageToken = resCalendar?.data?.nextSyncToken;

              if (pageToken) {
                listEventsParameters['pageToken'] = pageToken;
                const resNextCalendar = await service.events.list({
                  calendarId: syncGoogleUserCalendarId,
                  ...listEventsParameters,
                });
                calendarEventFeed = resNextCalendar?.data?.items;
              } else {
                break;
              }
            } catch (error) {
              break;
            }
          }

          if (dayjs(syncGoogleUserGoogleLastModified).isValid()) {
            syncGoogleUserGoogleLastModified = dayjs(
              syncGoogleUserGoogleLastModified,
            )
              .add(1, 'second')
              .format('YYYY-DD-MM HH:mm:ss');
            await this.datasource.query(
              `
            UPDATE T_SYNC_GOOGLE_USER_SGU
            SET SGU_GOOGLE_LAST_MODIFIED = ?
            WHERE USR_ID = ?`,
              [syncGoogleUserGoogleLastModified, userId],
            );
          }
        }
      } catch (error) {
        this.logger.debug(
          'An error has occurred during synchronization',
          error,
        );
      }
    }
  }
}
