import { Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import * as dayjs from 'dayjs';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { InjectEntityManager } from '@nestjs/typeorm';
import { ContactEntity } from 'src/entities/contact.entity';
import { GSM0338_CHARACTERS, TRANSLITERATE } from 'src/constants/gsmEncoder';
import { TexterService } from 'src/notifier/services/texter.service';
import { UserEntity } from 'src/entities/user.entity';
import Mail from 'nodemailer/lib/mailer';
import { AppointmentReminderLibraryEntity } from 'src/entities/appointment-reminder-library.entity';
import { MailTransportService } from 'src/mail/services/mailTransport.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ReminderService {
  constructor(
    private readonly datasource: DataSource,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly texterService: TexterService,
    private mailTransportService: MailTransportService,
    private config: ConfigService,
  ) {}
  private readonly logger = new Logger(ReminderService.name);

  public utf8ToGsm0338(utf8String, replacement = '') {
    for (const character of utf8String) {
      const codepoint = character.codePointAt(0);
      const hexvalue = `0x${codepoint
        .toString(16)
        .toUpperCase()
        .padStart(4, '0')}`;
      if (GSM0338_CHARACTERS.includes(hexvalue)) {
        replacement += character;
      } else if (TRANSLITERATE.hasOwnProperty(hexvalue)) {
        replacement += String.fromCodePoint(
          parseInt(TRANSLITERATE[hexvalue], 16),
        );
      }
    }
    return replacement;
  }

  public isValidEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async reminder() {
    // Bug from when run mutiple instance. All cron need this condition
    const isRunCron = this.config.get<boolean>('app.isRunCron');
    if (!isRunCron) {
      return;
    }
    //

    const defaultMessage = fs.readFileSync(
      path.join(process.cwd(), 'templates', 'reminder/standard.hbs'),
      'utf-8',
    );
    const reminderStmQuery = `
    SELECT
          T_REMINDER_RMD.RMD_ID as reminderId,
          T_REMINDER_RMD.appointment_reminder_library_id,
          T_REMINDER_TYPE_RMT.RMT_ID as reminderTypeId,
          T_REMINDER_RECEIVER_RMR.RMR_ID as reminderReceiverId,
          T_REMINDER_MESSAGE_RMM.RMM_MSG as reminderMessage,
          T_EVENT_EVT.EVT_START as eventStart,
          T_EVENT_EVT.EVT_START_TZ as eventStartTz,
          T_EVENT_EVT.EVT_MSG as eventComment,
          T_USER_USR.USR_ID as userId,
          T_USER_USR.organization_id as organizationId,
          T_USER_USR.USR_LASTNAME as userLastname,
          T_USER_USR.USR_FIRSTNAME as userFirstname,
          T_USER_USR.USR_MAIL as userEmail,
          T_USER_USR.USR_GSM as userPhoneNumber,
          T_USER_PREFERENCE_USP.USP_COUNTRY as userPreferenceCountry,
          T_CONTACT_CON.CON_ID as patientId,
          T_CONTACT_CON.CON_LASTNAME as patientLastname,
          T_CONTACT_CON.CON_FIRSTNAME as patientFirstname,
          T_CONTACT_CON.CON_MAIL as patientEmail,
          T_ADDRESS_ADR.ADR_COUNTRY_ABBR as addressCountryCode,
          T_GENDER_GEN.GEN_NAME AS civility_name,
          T_GENDER_GEN.long_name AS civility_long_name
      FROM T_REMINDER_RMD
      JOIN T_REMINDER_TYPE_RMT
      JOIN T_REMINDER_RECEIVER_RMR
      JOIN T_EVENT_EVT
      JOIN T_USER_USR
      JOIN T_USER_PREFERENCE_USP
      LEFT JOIN T_REMINDER_MESSAGE_RMM ON T_REMINDER_MESSAGE_RMM.USR_ID = T_EVENT_EVT.USR_ID AND T_REMINDER_MESSAGE_RMM.RMT_ID = T_REMINDER_TYPE_RMT.RMT_ID
      LEFT JOIN T_CONTACT_CON ON T_CONTACT_CON.CON_ID = T_EVENT_EVT.CON_ID
      LEFT JOIN T_ADDRESS_ADR ON T_ADDRESS_ADR.ADR_ID = T_CONTACT_CON.ADR_ID
      LEFT JOIN T_GENDER_GEN ON T_GENDER_GEN.GEN_ID = T_CONTACT_CON.GEN_ID
      WHERE T_REMINDER_RMD.sending_date_utc BETWEEN SUBDATE(UTC_TIMESTAMP(), INTERVAL 5 MINUTE) AND ADDDATE(UTC_TIMESTAMP(), INTERVAL 5 MINUTE)
        AND T_REMINDER_RMD.RMD_FLAG = 0
        AND T_REMINDER_RMD.RMT_ID = T_REMINDER_TYPE_RMT.RMT_ID
        AND T_REMINDER_RMD.RMR_ID = T_REMINDER_RECEIVER_RMR.RMR_ID
        AND T_REMINDER_RMD.EVT_ID = T_EVENT_EVT.EVT_ID
        AND T_EVENT_EVT.EVT_DELETE = 0
        AND T_EVENT_EVT.USR_ID = T_USER_USR.USR_ID
        AND T_USER_USR.USR_CLIENT != 5
        AND JSON_EXTRACT(T_USER_USR.settings, '$.activateSendingAppointmentReminders') = true
        AND T_USER_USR.USR_ID = T_USER_PREFERENCE_USP.USR_ID
        AND CASE T_REMINDER_RMD.RMR_ID
          WHEN 1 THEN T_EVENT_EVT.EVT_STATE = 0
          WHEN 2 THEN T_EVENT_EVT.EVT_STATE IN (0, 4)
          END
      GROUP BY T_REMINDER_RMD.RMD_ID`;

    const reminderStm = await this.datasource.query(reminderStmQuery);

    for (const reminder of reminderStm) {
      let reminderFlag = -1;
      const reminderId = reminder?.reminderId;
      let reminderMessage = reminder?.reminderMessage;
      const reminderTypeId = reminder?.reminderTypeId;
      const reminderReceiverId = reminder?.reminderReceiverId;
      const eventStart = dayjs(reminder?.eventStart).format(
        'YYYY-MM-DD HH:mm:ss',
      );
      const eventComment = reminder?.eventComment;
      const userId = reminder?.userId;
      const userLastname = reminder?.userLastname;
      const userFirstname = reminder?.userFirstname;
      const userEmail = reminder?.userEmail;
      const userPhoneNumber = reminder?.userPhoneNumber;
      const userPreferenceCountry = reminder?.userPreferenceCountry;
      const organizationId = reminder?.organizationId;
      const patientId = reminder?.patientId;
      const patientLastname = reminder?.patientLastname;
      const patientFirstname = reminder?.patientFirstname;
      const patientEmail = reminder?.patientEmail;
      const addressCountryCode = reminder?.addressCountryCode;
      const civilityName = reminder?.civility_name;
      const civilityLongName = reminder?.civility_long_name;
      let eventStartDateAsString;

      try {
        await this.datasource.query(`SET @groupid = ?`, [organizationId]);

        if (!reminderMessage) {
          reminderMessage = defaultMessage;
        }
        const eventStartTimeAsString = dayjs(eventStart).format('YYYY-MM-DD');
        const matches = reminderMessage.match(/\s*\|\s*date\(["'](.*)["']\)/);
        if (matches) {
          eventStartDateAsString = dayjs(eventStart).format(matches);
          reminderMessage = reminderMessage.replace(
            /\s*\|\s*date\(["'](.*)["']\)/g,
            '',
          );
        } else {
          eventStartDateAsString = eventStartTimeAsString;
        }

        const template = handlebars.compile(reminderMessage);
        let templateRendered = template({
          date: eventStartDateAsString,
          time: eventStartTimeAsString,
          comment: eventComment,
          practitioner: {
            lastname: userLastname,
            firstname: userFirstname,
          },
          contact: {
            lastname: patientLastname,
            firstname: patientFirstname,
            civility: {
              name: civilityName,
              long_name: civilityLongName,
            },
          },
        });

        if (reminderTypeId === 1) {
          let countryCode = 'FR';
          let phoneNumber = null;
          if (reminderReceiverId === 1) {
            const result: { phoneNumbers_PHO_NBR: string } =
              await this.entityManager
                .createQueryBuilder(ContactEntity, 'patient')
                .innerJoinAndSelect('patient.phoneNumbers', 'phoneNumbers')
                .innerJoinAndSelect('phoneNumbers.category', 'category')
                .where('patient.id = :patientId', { patientId: patientId })
                .andWhere('category.name = :categoryName', {
                  categoryName: 'sms',
                })
                .select('phoneNumbers.nbr')
                .getRawOne();
            if (result) phoneNumber = result?.phoneNumbers_PHO_NBR;

            if (addressCountryCode) {
              countryCode = addressCountryCode;
            }
          } else if (reminderReceiverId === 2) {
            phoneNumber = userPhoneNumber;
            if (userPreferenceCountry) {
              countryCode = userPreferenceCountry;
            }
          }

          try {
            templateRendered = this.utf8ToGsm0338(templateRendered);
            const currentUser = await this.datasource
              .getRepository(UserEntity)
              .findOne({ where: { id: userId } });
            const notifier = this.texterService;
            notifier.setUser(currentUser);
            notifier.addReceiver(phoneNumber, countryCode);

            const response = await notifier.send(templateRendered);

            this.logger.debug(
              "Envoi d'un rappel de rendez-vous par sms",
              response,
            );

            reminderFlag = 1;
          } catch (error) {
            this.logger.error(error);
          }
        } else if (reminderTypeId === 2) {
          const senderEmail = userEmail;
          let receiverEmail = null;

          if (reminderReceiverId === 1) {
            receiverEmail = patientEmail;
          } else if (reminderReceiverId === 2) {
            receiverEmail = userEmail;
          }

          if (
            this.isValidEmail(senderEmail) === false ||
            this.isValidEmail(receiverEmail) === false
          ) {
            this.logger.debug("Echec d'envoi d'un email", {
              id: reminderId,
              from: `${userLastname} ${userFirstname} <${senderEmail}>`,
              to: receiverEmail,
            });
          } else {
            const email: Mail.Options = {
              from: `${senderEmail} ${userLastname} ${userFirstname}`,
              to: receiverEmail,
              subject: `Rappel de votre rendez-vous du ${eventStartDateAsString} ${eventStartTimeAsString}`,
              text: templateRendered,
            };
            const appointmentReminderLibraryId =
              reminder?.appointment_reminder_library_id;
            const appointmentReminderLibrary = await this.datasource
              .getRepository(AppointmentReminderLibraryEntity)
              .findOne({
                where: { id: appointmentReminderLibraryId },
                relations: { attachments: true },
              });
            if (appointmentReminderLibraryId && appointmentReminderLibrary) {
              const attachArray = [];
              for (const attachment of appointmentReminderLibrary?.attachments) {
                if (
                  attachment?.fileName &&
                  fs.existsSync(
                    path.join(process.cwd(), 'uploads', attachment?.fileName),
                  )
                ) {
                  const file = fs.createReadStream(
                    path.join(process.cwd(), 'uploads', attachment?.fileName),
                  );
                  attachArray.push({
                    filename: attachment?.name ?? '',
                    content: file,
                  });
                }
              }
              if (attachArray.length > 0) {
                email.attachments = attachArray;
              }
            }

            await this.mailTransportService.sendEmail(userId, email);

            this.logger.debug("Envoi d'un email", {
              id: reminderId,
              user_id: userId,
              from: `${userLastname} ${userFirstname} <${senderEmail}>`,
              to: receiverEmail,
            });

            await this.datasource.query(
              `
            INSERT INTO T_USER_SMS_HISTORY_USH (USR_ID, RMT_ID, USH_USED, USH_RECEIVER, USH_MSG) 
            VALUES (?, ?, CURRENT_TIMESTAMP(), ?, ?)`,
              [userId, reminderTypeId, receiverEmail, templateRendered],
            );
          }

          reminderFlag = 1;
        } else if (reminderTypeId == 3) {
          await this.datasource.query(
            `
          INSERT INTO notification (user_id, notification_operation_id, title)
          VALUES (?, 2, ?)`,
            [
              userId,
              `Rappel du rendez-vous du ${eventStartDateAsString} à ${eventStartTimeAsString}`,
            ],
          );
          reminderFlag = 1;
        }
      } catch (error) {
        this.logger.error(error);
      }

      await this.datasource.query(
        `
       UPDATE T_REMINDER_RMD
      SET RMD_FLAG = ?
      WHERE RMD_ID = ?`,
        [reminderFlag, reminderId],
      );
    }
  }
}
