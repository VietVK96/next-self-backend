import { Injectable } from '@nestjs/common';
import { DataSource, IsNull, Repository } from 'typeorm';
import { TranformVariableParam } from '../dto/transformVariable.dto';
import { format } from 'date-fns';
import Handlebars from 'handlebars';
import { EnumLettersType, LettersEntity } from 'src/entities/letters.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class DocumentMailService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(LettersEntity)
    private readonly mailRepository: Repository<LettersEntity>,
  ) {}

  /**
   * File: application/Services/Document/Mail.php
   *
   * Transformation des variables d'un message.
   *
   * @param string $message Le message à transformer
   * @param integer $groupId Identifiant du groupe
   * @param integer $practitionerId Identifiant de l'utilisateur
   * @param integer $patientId Identifiant du patient
   * @param integer $correspondentId Identifiant du correspondant
   *
   * @return string Le message après transformation
   */

  async transformVariable(param: TranformVariableParam) {
    const practitioners = await this.dataSource.query(
      ` SELECT
                USR.USR_LASTNAME lastname,
                USR.USR_FIRSTNAME firstname,
                USR.USR_MAIL email,
                USR.USR_PHONE_NUMBER phoneNumber,
                USR.USR_GSM gsm,
                USR.USR_FAX_NUMBER faxNumber,
                USR.USR_NUMERO_FACTURANT numeroFacturant,
                USR.freelance
            FROM T_USER_USR USR
            LEFT OUTER JOIN T_ADDRESS_ADR ADR ON ADR.ADR_ID = USR.ADR_ID
            WHERE USR.USR_ID = ?
              AND USR.organization_id = ?`,
      [param.practitionerId, param.groupId],
    );

    if (practitioners.length > 0) {
      const practitioner = practitioners[0];
      practitioner.fullname = `${practitioner.lastname} ${
        practitioner.firstname
      }${practitioner.freelance ? ' "EI"' : ''}`;
      const addr = await this.dataSource.query(
        `SELECT
            ADR.ADR_STREET street,
            ADR.ADR_ZIP_CODE zipCode,
            ADR.ADR_CITY city,
            ADR.ADR_COUNTRY country
        FROM T_ADDRESS_ADR ADR
        JOIN T_USER_USR USR
        WHERE ADR.ADR_ID = USR.ADR_ID
          AND USR.USR_ID = ?`,
        [param.practitionerId],
      );
      practitioner.address = addr?.length > 0 ? addr[0] : {};
    }

    const customers = await this.dataSource.query(
      `SELECT
                CON.CON_NBR nbr,
                CON.CON_LASTNAME lastname,
                CON.CON_FIRSTNAME firstname,
                CON.CON_BIRTHDAY birthday,
                CON.CON_MAIL email,
                CON.CON_INSEE insee,
                CON.CON_INSEE_KEY inseeKey,
                GEN.GEN_NAME gender,
                IF (GEN.GEN_TYPE = 'F', 'Chère', 'Cher') dear,
                cou.cou_amount_due amountDue,
                cou.cou_last_payment dateLastRec,
                cou.cou_last_care dateLastSoin
            FROM T_CONTACT_CON CON
            LEFT OUTER JOIN T_GENDER_GEN GEN ON GEN.GEN_ID = CON.GEN_ID
            LEFT OUTER JOIN contact_user_cou cou ON cou.con_id = CON.CON_ID AND cou.usr_id = ?
            WHERE CON.CON_ID = ?
              AND CON.organization_id = ?`,
      [param.practitionerId, param.patientId, param.groupId],
    );

    if (customers.length > 0) {
      const customer = customers[0];
      customer.dental = {
        insee: customer.insee,
        inseeKey: customer.inseeKey,
      };
      customer.nextAppointmentDate = '';
      customer.nextAppointmentTime = '';
      customer.nextAppointmentDuration = '';
      customer.nextAppointmentTitle = '';
      const addr = await this.dataSource.query(
        `SELECT
                    ADR.ADR_STREET street,
                    ADR.ADR_ZIP_CODE zipCode,
                    ADR.ADR_CITY city,
                    ADR.ADR_COUNTRY country
                FROM T_ADDRESS_ADR ADR
                JOIN T_CONTACT_CON CON
                WHERE ADR.ADR_ID = CON.ADR_ID
                  AND CON.CON_ID = ?`,
        [param.patientId],
      );

      customer.adrress = addr.length > 0 ? addr[0] : {};

      customer.dateOfNextReminder = await this.dataSource.query(
        `SELECT 
                IF (CON.CON_REMINDER_VISIT_TYPE = 'duration',
                    ADDDATE(MAX(DATE(EVT.EVT_START)), INTERVAL (IFNULL(CON.CON_REMINDER_VISIT_DURATION, USP.USP_REMINDER_VISIT_DURATION)) MONTH),
                    CON.CON_REMINDER_VISIT_DATE) 
                FROM T_CONTACT_CON CON
                JOIN T_EVENT_EVT EVT
                JOIN T_USER_USR USR
                JOIN T_USER_PREFERENCE_USP USP
                WHERE CON.CON_ID = ?
                  AND CON.CON_ID = EVT.CON_ID
                  AND EVT.USR_ID = ?
                  AND EVT.USR_ID = USR.USR_ID
                  AND USR.USR_ID = USP.USR_ID`,
        [param?.patientId, param?.practitionerId],
      );

      const nextAppointment = await this.dataSource.query(
        `SELECT
                T_EVENT_EVT.EVT_NAME,
                T_EVENT_EVT.EVT_START,
                T_EVENT_EVT.EVT_END
            FROM T_EVENT_EVT
            WHERE
                T_EVENT_EVT.CON_ID = ? AND
                T_EVENT_EVT.EVT_START > CURRENT_TIMESTAMP() AND
                T_EVENT_EVT.deleted_at IS NULL
            ORDER BY
                T_EVENT_EVT.EVT_START
            LIMIT 1
        `,
        [param.patientId],
      );

      if (nextAppointment.length > 0) {
        const datetime1 = new Date(nextAppointment[0].EVT_START);
        const datetime2 = new Date(nextAppointment[0].EVT_END);
        const interval = datetime2.getTime() - datetime1.getTime();
        const duration = new Date(interval);
        const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        });

        customer.nextAppointmentDate = dateFormatter.format(datetime1);
        customer.nextAppointmentTime = timeFormatter.format(datetime1);
        customer.nextAppointmentDuration = `${duration.getUTCHours()}h ${duration.getUTCMinutes()}m`;
        customer.nextAppointmentTitle = nextAppointment[0].EVT_NAME;
      }

      const promisePhone = await this.dataSource.query(
        `SELECT
                    PHO.PHO_NBR number,
                    PTY.PTY_NAME name
                FROM T_CONTACT_PHONE_COP COP
                JOIN T_PHONE_PHO PHO
                JOIN T_PHONE_TYPE_PTY PTY
                WHERE COP.CON_ID = ?
                  AND COP.PHO_ID = PHO.PHO_ID
                  AND PHO.PTY_ID = PTY.PTY_ID
                GROUP BY PTY.PTY_ID`,
        [param.patientId],
      );
      if (promisePhone.length > 0) {
        customer.phones = promisePhone.map((phone) => {
          return {
            [phone.name]: phone.number,
          };
        });
      } else {
        customer.phones = [];
      }
    }
    const correspondents = await this.dataSource.query(
      `SELECT
                CPD.CPD_LASTNAME lastname,
                CPD.CPD_FIRSTNAME firstname,
                CPD.CPD_TYPE type,
                CPD.CPD_MAIL email,
                CPD.CPD_MSG msg,
                GEN.GEN_NAME gender,
                IF (GEN.GEN_TYPE = 'F', 'Chère', 'Cher') dear
            FROM T_CORRESPONDENT_CPD CPD
            LEFT OUTER JOIN T_GENDER_GEN GEN ON GEN.GEN_ID = CPD.GEN_ID
            WHERE CPD.CPD_ID = ?
              AND CPD.organization_id = ?`,
      [param.correspondentId, param.groupId],
    );

    if (correspondents.length > 0) {
      const correspondent = correspondents[0];

      const addr = await this.dataSource.query(
        `SELECT
                    ADR.ADR_STREET street,
                    ADR.ADR_ZIP_CODE zipCode,
                    ADR.ADR_CITY city,
                    ADR.ADR_COUNTRY country
                FROM T_ADDRESS_ADR ADR
                JOIN T_CORRESPONDENT_CPD CPD
                WHERE ADR.ADR_ID = CPD.ADR_ID
                  AND CPD.CPD_ID = ?`,
        [param.correspondentId],
      );
      correspondent.address = addr.length > 0 ? addr[0] : {};

      const promisePhone = await this.dataSource.query(
        `SELECT
                    PHO.PHO_NBR number,
                    PTY.PTY_NAME name
                FROM T_CONTACT_PHONE_COP COP
                JOIN T_PHONE_PHO PHO
                JOIN T_PHONE_TYPE_PTY PTY
                WHERE COP.CON_ID = ?
                  AND COP.PHO_ID = PHO.PHO_ID
                  AND PHO.PTY_ID = PTY.PTY_ID
                GROUP BY PTY.PTY_ID`,
        [param.correspondentId],
      );

      if (promisePhone.length > 0) {
        correspondent.phones = promisePhone.map((phone) => {
          return {
            [phone.name]: phone.number,
          };
        });
      } else {
        correspondent.phones = [];
      }
    }

    const context: any = {};
    context.today = format(new Date(), 'P');
    context.todayLong = format(new Date(), 'PPP');
    context['praticien'] = practitioners?.[0];
    context['practitioner'] = practitioners?.[0];
    context['contact'] = customers?.[0];
    context['correspondent'] = correspondents?.[0];

    const errParser = `</span></span></span><span style="vertical-align: inherit;"><span style="vertical-align: inherit;"><span style="vertical-align: inherit;">`;
    while (param.message?.includes(errParser)) {
      param.message = param.message.replace(errParser, '');
    }

    Handlebars.registerHelper('formatDate', function (dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      });
    });

    return Handlebars.compile(param.message)(context);
  }

  /**
   * File: php/document/mail/findAll.php
   */
  async findAll(user: number, type?: EnumLettersType) {
    //@Todo missing relations
    const mails = await this.mailRepository.find({
      select: ['id', 'title', 'type', 'conId', 'cpdId', 'usrId'],
      where: [
        {
          conId: IsNull(),
          cpdId: IsNull(),
          usrId: IsNull(),
          type: EnumLettersType[type.toLocaleUpperCase()],
        },
        {
          conId: IsNull(),
          cpdId: IsNull(),
          usrId: user,
          type: EnumLettersType[type.toLocaleUpperCase()],
        },
      ],
    });

    return mails;
  }
}
