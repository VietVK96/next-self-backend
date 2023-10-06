import { Injectable } from '@nestjs/common';
import { DataSource, In, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { EventEntity } from 'src/entities/event.entity';
import { UserEntity } from 'src/entities/user.entity';
import {
  PrivilegeEntity,
  EnumPrivilegeTypeType,
} from 'src/entities/privilege.entity';
import { UserPreferenceQuotationEntity } from 'src/entities/user-preference-quotation.entity';
import { PlanPlfEntity } from 'src/entities/plan-plf.entity';
import { ContactEntity } from 'src/entities/contact.entity';
import { DentalQuotationActEntity } from 'src/entities/dental-quotation-act.entity';
import { LettersEntity } from 'src/entities/letters.entity';
import { PrintPDFDto } from '../dto/facture.dto';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { ErrorCode } from 'src/constants/error';
import {
  PdfTemplateFile,
  PrintPDFOptions,
  customCreatePdf,
} from 'src/common/util/pdf';
import * as path from 'path';
import { DevisStd2ActesRes, DevisStd2InitRes } from '../res/devisStd2.res';
import { checkDay, customDayOfYear } from 'src/common/util/day';
import * as dayjs from 'dayjs';
import { checkId, toFixed } from 'src/common/util/number';
import { PaymentScheduleService } from 'src/payment-schedule/services/payment-schedule.service';
import { DevisStd2Dto } from '../dto/devisStd2.dto';
import { DentalQuotationEntity } from 'src/entities/dental-quotation.entity';
import { BillEntity } from 'src/entities/bill.entity';
import { br2nl, generateFullName, validateEmail } from 'src/common/util/string';
import { StringHelper } from 'src/common/util/string-helper';
import { DOMParser, XMLSerializer } from 'xmldom';
import { PatientOdontogramService } from 'src/patient/service/patientOdontogram.service';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import { MailTransportService } from 'src/mail/services/mailTransport.service';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class DevisStd2Services {
  constructor(
    @InjectRepository(BillEntity)
    private billRepository: Repository<BillEntity>,
    @InjectRepository(PlanPlfEntity)
    private planPlfRepository: Repository<PlanPlfEntity>,
    @InjectRepository(DentalQuotationActEntity)
    private dentalQuotationActRepository: Repository<DentalQuotationActEntity>, //dental
    @InjectRepository(DentalQuotationEntity)
    private dentalQuotationRepository: Repository<DentalQuotationEntity>,
    @InjectRepository(EventEntity)
    private eventRepository: Repository<EventEntity>, //event
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(PrivilegeEntity)
    private privilegeRepository: Repository<PrivilegeEntity>,
    @InjectRepository(UserPreferenceQuotationEntity)
    private userPreferenceQuotationRepository: Repository<UserPreferenceQuotationEntity>,
    @InjectRepository(ContactEntity)
    private contactRepository: Repository<ContactEntity>, //event
    @InjectRepository(ContactNoteEntity)
    private contactNoteRepo: Repository<ContactNoteEntity>,
    private dataSource: DataSource,
    private paymentScheduleService: PaymentScheduleService,
    private patientOdontogramService: PatientOdontogramService,
    private mailTransportService: MailTransportService,
    private configService: ConfigService,
  ) {}

  // ecoophp/dental/devisStd2/devisStd2_email
  async sendMail(id: number, identity: UserIdentity) {
    try {
      id = checkId(id);
      const data = await this.dentalQuotationRepository.findOne({
        where: {
          id: id || 0,
        },
        relations: {
          user: {
            setting: true,
            address: true,
          },
          contact: true,
          treatmentPlan: true,
        },
      });

      if (
        !validateEmail(data?.user?.email) ||
        !validateEmail(data?.contact?.email)
      ) {
        throw new CBadRequestException(
          'Veuillez renseigner une adresse email valide dans la fiche patient',
        );
      }

      const date = dayjs(data.date).locale('fr').format('DD MMM YYYY');
      const filename = `Devis_${dayjs(data.date).format('YYYY_MM_DD')}.pdf`;
      const tempFolder = this.configService.get<string>(
        'app.mail.folderTemplate',
      );
      const emailTemplate = fs.readFileSync(
        path.join(tempFolder, 'mail/quote.hbs'),
        'utf-8',
      );
      const userFullName = generateFullName(
        data?.user?.firstname,
        data?.user?.lastname,
      );

      // get template
      handlebars.registerHelper({
        isset: (v1: any) => {
          if (Number(v1)) return true;
          return v1 ? true : false;
        },
      });
      const template = handlebars.compile(emailTemplate);
      const mailBody = template({ data, date, userFullName });

      const subject = `Devis du ${date} de Dr ${userFullName} pour ${generateFullName(
        data?.contact?.firstname,
        data?.contact?.lastname,
      )}`;
      await this.mailTransportService.sendEmail(identity.id, {
        from: data.user.email,
        to: data.contact.email,
        subject,
        html: mailBody,
        // context: {
        //   quote: data,
        // },
        attachments: [
          {
            filename: filename,
            content: await this.generatePdf({ id }, identity),
          },
        ],
      });

      if (data?.treatmentPlan?.id) {
        await this.planPlfRepository.save({
          ...data.treatmentPlan,
          sentToPatient: 1,
          sendingDateToPatient: dayjs().format('YYYY-MM-DD'),
        });
      }

      await this.contactNoteRepo.save({
        conId: data.contactId,
        message: `Envoi par email du devis du ${date} de ${data.user.lastname} ${data.user.firstname}`,
      });

      return {
        success: true,
      };
    } catch (error) {
      throw new CBadRequestException(ErrorCode.CANNOT_SEND_MAIL);
    }
  }
  // ecoophp/dental/devisStd2/devisStd2_init_champs.php
  async getInitChamps(
    req: DevisStd2Dto,
    identity?: UserIdentity,
  ): Promise<DevisStd2InitRes> {
    let result: DevisStd2InitRes = {} as DevisStd2InitRes;
    let idUser = identity?.id; //user id get to session
    const withs = req?.id_user; // id user to payload
    const id_pdt = req?.no_pdt;
    const type = EnumPrivilegeTypeType.NONE;
    if (withs) {
      const privilege = await this.privilegeRepository.find({
        where: {
          usrId: idUser,
          usrWithId: In([withs]),
          type: Not(type),
        },
      });
      if (!privilege) {
        console.error(
          "Vous n'avez pas assez de privilège pour accéder aux factures",
        );
      } else {
        idUser = withs;
      }
    }
    let userQuery: UserEntity;
    try {
      userQuery = await this.userRepository.findOne({
        where: { id: idUser },
        relations: ['type', 'userPreferenceQuotation', 'address'],
      });
      const userType = userQuery?.type;
      const userPreferenceQuotationEntity = userQuery?.userPreferenceQuotation;
      if (userPreferenceQuotationEntity) {
        result.userPreferenceQuotationColor =
          userPreferenceQuotationEntity?.color;
      } else {
        result.userPreferenceQuotationColor = 'blue';
      }

      result.userSocialSecurityReimbursementRate = toFixed(
        userQuery?.socialSecurityReimbursementRate,
      );
      result.userRateCharges = toFixed(userQuery?.rateCharges);
      result.userSignature = userQuery?.signature;
      result.addressEntity = userQuery?.address;

      if (userType === null) {
        throw new CBadRequestException(
          "Vous n'avez pas assez de privilège pour accéder aux factures",
        );
      }
    } catch {
      throw new CBadRequestException(
        "Vous n'avez pas assez de privilège pour accéder aux factures",
      );
    }

    if (!id_pdt && !req?.no_devis) {
      throw new CBadRequestException(
        'Pas de plan de traitement ni de devis s&eacute;lectionn&eacute;',
      );
    }

    result.medical_entete_id = 0;

    result.datedevisStd2 = dayjs().format('MM/DD/YY');
    result.titredevisStd2 = 'Devis pour traitement bucco-dentaire';

    result.txch = 0;
    result.couleur = 'blue';
    result.schemas = 'both';
    result.quotationSignaturePatient = null;
    result.quotationSignaturePraticien = null;

    if (result?.userRateCharges) {
      result.txch =
        result?.userRateCharges >= 1
          ? result?.userRateCharges / 100
          : result?.userRateCharges;
    }

    const userConnectedPreferenceQuotationEntity =
      await this.userPreferenceQuotationRepository.findOneBy({
        usrId: identity?.id,
      });
    if (userConnectedPreferenceQuotationEntity) {
      result.userPreferenceQuotationDisplayTooltip =
        userConnectedPreferenceQuotationEntity?.displayTooltip;
    } else {
      result.userPreferenceQuotationDisplayTooltip = 1;
    }
    const today = dayjs();
    const year = today.year();
    const dayOfYear = customDayOfYear();

    // Assuming you have an asynchronous function named 'executeQuery' that performs the query
    let random = await this.dataSource.query(
      `
      SELECT COALESCE(SUBSTRING(MAX(reference), -5), 0) AS reference
       FROM T_DENTAL_QUOTATION_DQO
       WHERE USR_ID = ?
      AND reference LIKE CONCAT(?, ?, '%')`,
      [userQuery?.id, year, dayOfYear],
    );
    if (!random) {
      random = 1;
    } else {
      random = parseInt(random) + 1;
    }
    result.reference = year + dayOfYear + '-' + String(random).padStart(5, '0');

    if (id_pdt) {
      const plans = await this.planPlfRepository.findOne({
        where: { id: id_pdt },
        relations: ['events'],
      });

      if (!plans) {
        throw new CBadRequestException(
          'You do not have the required permission to perform this operation',
        );
      } else if (!plans.events?.length) {
        throw new CBadRequestException(
          'You do not have the required permission to perform this operation',
        );
      }
      for (const planEvent of plans.events) {
        const event = await this.eventRepository.findOne({
          where: { id: planEvent.evtId },
        });
        const contact = await this.contactRepository?.findOne({
          where: {
            organizationId: identity?.org,
            id: event?.conId,
          },
        });
        event.contact = contact;
        planEvent.event = event;
      }
      let ids_events = '';
      let last_event_id = 0;

      plans.events.forEach((event) => {
        last_event_id = event?.evtId;
        if (last_event_id) ids_events += last_event_id + ',';
      });
      ids_events = ids_events.slice(0, -2);

      const sql = await this.eventRepository.findOne({
        where: { id: last_event_id },
      });
      if (!sql) {
        throw new CBadRequestException(
          'Probl&egrave;me durant le rapatriement des informations du rendez-vous ...',
        );
      }
      result.id_contact = sql?.conId;
      result.id_user = req?.id_user;
      if (!result.id_user) {
        result.id_user = sql?.usrId;
        if (!result.id_user) {
          throw new CBadRequestException(
            'Un identifiant de praticien est requis',
          );
        }
      }

      const dataUser = await this.userRepository.findOne({
        where: { id: result.id_user },
        relations: ['address'],
      });

      result.identPrat =
        'Dr. ' +
        dataUser?.lastname +
        ' ' +
        dataUser?.firstname +
        (dataUser?.freelance ? '" EI "' : '');
      result.adresse_prat = dataUser?.address?.city;

      const dataContact = await this.dataSource.query(
        `
                    SELECT 
                        GEN_NAME as 'civilite',
                        CON.CON_LASTNAME AS patient_lastname,
                        CON.CON_FIRSTNAME AS patient_firstname,
                        CONCAT(CON.CON_LASTNAME, ' ', CON.CON_FIRSTNAME) as 'nom_prenom_patient',
                        CON.CON_INSEE as 'INSEE',
                        CON.CON_BIRTHDAY as 'birthday',
                        CON.ADR_ID,
                        CON.CON_MAIL as 'email',
                        CONCAT(ADR.ADR_STREET, '\n', ADR.ADR_ZIP_CODE, ' ', ADR.ADR_CITY) as address,
                        (
                            SELECT
                                CONCAT(PHO.PHO_NBR, ' (', PTY.PTY_NAME, ')') 
                            FROM T_CONTACT_PHONE_COP COP, T_PHONE_PHO PHO, T_PHONE_TYPE_PTY PTY
                            WHERE COP.CON_ID = CON.CON_ID
                              AND COP.PHO_ID = PHO.PHO_ID
                              AND PHO.PTY_ID = PTY.PTY_ID
                            ORDER BY PTY.PTY_ID
                            LIMIT 1
                        ) as phone
                    FROM T_CONTACT_CON CON
                    LEFT OUTER JOIN T_ADDRESS_ADR ADR ON ADR.ADR_ID = CON.ADR_ID
                    LEFT OUTER JOIN T_GENDER_GEN GEN ON GEN.GEN_ID = CON.GEN_ID
                    WHERE CON.CON_ID = ?
        `,
        [result?.id_contact],
      );
      if (!dataContact) {
        throw new CBadRequestException(
          'Probl&egrave;me durant le rapatriement des nom et pr&eacute;nom du patient ...',
        );
      }
      result.civilite = dataContact[0]?.civilite;
      result.patientLastname = dataContact[0]?.patient_lastname;
      result.patientFirstname = dataContact[0]?.patient_firstname;
      result.patientCivilityName = dataContact[0]?.civilite;
      result.nom_prenom_patient = dataContact[0]?.nom_prenom_patient;

      if (dataContact?.civilite) {
        result.nom_prenom_patient =
          dataContact[0]?.civilite + ' ' + result?.nom_prenom_patient;
        result.adresse_pat =
          result?.nom_prenom_patient + '\n' + dataContact[0]?.address;
        result.tel = dataContact[0]?.phone;
      }
      const dataActes = await this.dataSource.manager.query(`
          SELECT ETK.ETK_ID as 'id_devisStd2_ligne',
          ETK.library_act_id,
          ETK.library_act_quantity_id,
             '00/00/0000' as 'dateLigne',
             ETK.ETK_NAME as 'descriptionLigne',
             IFNULL(ETK.ETK_AMOUNT, 0) as 'prixLigne',
             IFNULL(DET.DET_PURCHASE_PRICE, 0) as 'prixachat',
             DET.DET_TOOTH as 'dentsLigne',
             DET.DET_COEF as coef,
             ngap_key.name AS ngap_key_name,
             
             DET.DET_TYPE as type,
             DET.DET_CCAM_CODE as ccamCode,
             
             IF (DET.DET_TYPE = 'CCAM', DET.DET_CCAM_CODE, CONCAT_WS(' ', ngap_key.name, DET.DET_COEF)) as cotation,
             IFNULL(IF (DET.DET_TYPE = 'CCAM', DET.DET_SECU_AMOUNT, (ngap_key.unit_price * DET.DET_COEF)), 0) as tarif_secu,
             
             IFNULL(DET.DET_SECU_AMOUNT, 0) as secuAmount,
             IFNULL(DET.DET_SECU_REPAYMENT, 0) as secuRepayment,
             IFNULL(DET.DET_MUTUAL_REPAYMENT_TYPE, 1) as mutualRepaymentType,
             IFNULL(DET.DET_MUTUAL_REPAYMENT_RATE, 0) as mutualRepaymentRate,
             IFNULL(DET.DET_MUTUAL_REPAYMENT, 0) as mutualRepayment,
             IFNULL(DET.DET_MUTUAL_COMPLEMENT, 0) as mutualComplement,
             IFNULL(DET.DET_PERSON_REPAYMENT, 0) as personRepayment,
             IFNULL(DET.DET_PERSON_AMOUNT, 0) as personAmount,
             
             IF (DET.DET_EXCEEDING = 'N', 'non', 'oui') as remboursable,
             0 as 'materiau',
             0 as 'roc',
             'operation' as 'typeLigne'
            FROM T_EVENT_TASK_ETK ETK
            LEFT OUTER JOIN T_DENTAL_EVENT_TASK_DET DET ON DET.ETK_ID = ETK.ETK_ID
            LEFT OUTER JOIN ngap_key ON ngap_key.id = DET.ngap_key_id
            WHERE ETK.EVT_ID IN (" ${ids_events}")
            ORDER BY ETK.EVT_ID, ETK.ETK_POS
          `);
      const actes: DevisStd2ActesRes[] = [];

      dataActes.forEach((row) => {
        row.rss = 0;
        if (row.remboursable === 'oui') {
          row.rss = row.tarif_secu;
        }
        switch (row.type) {
          case 'CCAM':
            row.cotation = row?.ccamCode;
            break;
          case 'NGAP':
            row.cotation = `${row.ngap_key_name?.replace(
              /^(C|D|Z)(R|V) MC/i,
              '$1',
            )} ${parseFloat(row.coef)}`;
            break;
          default:
            row.cotation = 'NPC';
            break;
        }
        const acte = { ...row };
        actes.push(acte);
      });
      result.actes = actes;
      result.date_devis = checkDay(plans?.createdAt, 'DD/MM/YYYY');
      result.duree_devis = '';
      result.organisme = ''; //"Nom de l'organisme complémentaire";
      result.contrat = ''; //"N° de contrat ou d'adhérent";
      result.ref = ''; //"Référence dossier";
      result.dispo = 'FALSE';
      result.dispo_desc = '';
      result.infosCompl = 'Les soins ne sont pas compris dans ce devis.';
      result.date_acceptation = '';
      result.dateSql = checkDay(plans?.createdAt, 'DD/MM/YYYY');
      const dataPlan = await this.planPlfRepository.findOne({
        where: { id: id_pdt },
      });
      result.paymentScheduleId = dataPlan?.paymentScheduleId;
      if (result?.paymentScheduleId) {
        result.paymentSchedule = await this.paymentScheduleService.duplicate(
          result?.paymentScheduleId,
          identity,
        );
        result.paymentScheduleId = result?.paymentSchedule?.id;
      }

      this.dataSource.transaction(async (manager) => {
        try {
          const paymentScheduleUpdate = await manager.query(
            `
              REPLACE INTO T_DENTAL_QUOTATION_DQO (USR_ID, PLF_ID, payment_schedule_id, reference, DQO_TYPE, DQO_COLOR, DQO_TITLE, DQO_IDENT_PRAT, CON_ID, DQO_IDENT_CONTACT, DQO_DATE, DQO_ADDRESS, DQO_TEL)
              VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)
              `,
            [
              req?.id_user,
              id_pdt,
              result?.paymentScheduleId || null,
              result.reference,
              result?.userPreferenceQuotationColor,
              result?.identPrat,
              result?.identPrat,
              result?.id_contact,
              result?.nom_prenom_patient,
              result?.dateSql,
              result?.adresse_prat,
              dataContact[0]?.phone,
            ],
          );

          result.idDevisStd2 = paymentScheduleUpdate?.insertId;
          let position = 0;
          for (const acte of result?.actes) {
            const inputParameters = [
              result.idDevisStd2,
              acte?.library_act_id,
              acte?.library_act_quantity_id,
              acte?.dentsLigne,
              acte?.descriptionLigne,
              acte?.materiau,
              acte?.cotation,
              acte?.remboursable,
              acte?.prixLigne,
              acte?.tarif_secu,
              acte?.rss,
              acte?.roc,
              ++position,
            ];

            const stmt = await manager.query(
              `
                INSERT INTO T_DENTAL_QUOTATION_ACT_DQA (DQO_ID, library_act_id, library_act_quantity_id, DQA_LOCATION, DQA_NAME, DQA_MATERIAL, DQA_NGAP_CODE, DQA_REFUNDABLE, DQA_AMOUNT, DQA_AMOUNT_SECU, DQA_RSS, DQA_ROC, DQA_TYPE, DQA_POS)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'operation', ?)
                `,
              inputParameters,
            );
            if (!stmt) {
              throw new CBadRequestException(
                'Probl&egrave;me durant la cr&eacute;ation des actes du devis ... ',
              );
            } else {
              acte.id_devisStd2_ligne = stmt?.insertId;
            }
          }
          const quote = await this.dentalQuotationActRepository.find({
            where: { DQOId: result?.idDevisStd2 },
            relations: ['quotation'],
          });
          const attachments: LettersEntity[] = [];
          for (const quoteAct of quote) {
            for (const attachment of quoteAct?.libraryAct?.attachments || []) {
              const exist = attachments.some((a) => a?.id === attachment?.id);
              if (!exist && attachment?.usrId == quoteAct?.quotation?.userId) {
                attachments.push(attachment);
              }
            }
          }
          result.attachments = attachments;
        } catch {
          throw new CBadRequestException('dsa');
        }
      });
    } else if (req?.no_devis) {
      try {
        const dataDENTALQUOTATIONS = await this.dataSource.query(
          `
         SELECT DQO.USR_ID as id_user,
                   DQO.PLF_ID as id_pdt,
                   DQO.CON_ID as ident_pat,
                   DQO.DQO_SCHEMES as schemassss,
                   DQO.DQO_COLOR as couleur,
                   DQO.DQO_DATE_ACCEPT as 'date_acceptation',
                   DQO.DQO_DATE as 'date_devis',
                   DQO.DQO_IDENT_PRAT as ident_prat,
                   DQO.DQO_ADDR_PRAT,
                   DQO.DQO_IDENT_CONTACT as nom_prenom_patient,
                   DQO.DQO_ADDRESS as adresse_pat,
                   DQO.DQO_MSG as description,
                   DQO.DQO_SIGNATURE_PATIENT as signaturePatient,
                   DQO.DQO_SIGNATURE_PRATICIEN as signaturePraticien,
                   DQO.payment_schedule_id,
                   DQO.reference,
                   user_medical.rpps_number AS doctor_rpps,
                   T_CONTACT_CON.CON_NBR AS patient_number,
                   T_CONTACT_CON.CON_LASTNAME AS patient_lastname,
                   T_CONTACT_CON.CON_FIRSTNAME AS patient_firstname,
                   T_CONTACT_CON.CON_BIRTHDAY AS patient_birthday,
                   CONCAT(T_CONTACT_CON.CON_INSEE, T_CONTACT_CON.CON_INSEE_KEY) AS patient_insee,
                   T_GENDER_GEN.GEN_NAME AS patient_civility_name,
                   T_GENDER_GEN.long_name AS patient_civility_long_name
            FROM T_DENTAL_QUOTATION_DQO DQO,
                  T_USER_USR USR
            JOIN user_medical
            JOIN T_CONTACT_CON
            LEFT OUTER JOIN T_GENDER_GEN ON T_GENDER_GEN.GEN_ID = T_CONTACT_CON.GEN_ID
            WHERE DQO.DQO_ID = ?
              AND DQO.USR_ID = USR.USR_ID
              AND USR.organization_id = ?
              AND USR.USR_ID = user_medical.user_id
              AND DQO.CON_ID = T_CONTACT_CON.CON_ID
          `,
          [req?.no_devis, identity?.org],
        );
        const dataDENTALQUOTATION = dataDENTALQUOTATIONS[0];
        if (!dataDENTALQUOTATION) {
          throw new CBadRequestException("Ce devis n'existe pas ...");
        }

        const couleur = dataDENTALQUOTATION?.couleur
          ? dataDENTALQUOTATION?.couleur
          : 'blue';

        const descriptions = dataDENTALQUOTATION?.description
          ? dataDENTALQUOTATION?.description.split(
              '[-----------------------------------------]',
            )
          : [];
        const dataActes = await this.dataSource.query(
          `
          SELECT DQA.DQA_ID as id_devisStd2_ligne,
                   DQA.DQA_TYPE as typeLigne,
                   DQA.DQA_LOCATION as dentsLigne, 
                   DQA.DQA_NAME as descriptionLigne, 
                   DQA.DQA_MATERIAL as materiau, 
                   DQA.DQA_NGAP_CODE as cotation, 
                   DQA.DQA_REFUNDABLE as remboursable,
                   100 as prixachat, 
                   DQA.DQA_AMOUNT as prixLigne, 
                   DQA.DQA_AMOUNT_SECU as tarif_secu, 
                   DQA.DQA_RSS as rss, 
                   DQA.DQA_ROC as roc
               FROM T_DENTAL_QUOTATION_ACT_DQA DQA
               WHERE DQA.DQO_ID = ?
               ORDER BY DQA.DQA_POS ASC, DQA.DQA_ID ASC
          `,
          [req?.no_devis],
        );

        const actes: DevisStd2ActesRes[] = [];
        dataActes.forEach((dataActe) => {
          if (!dataActe?.typeLigne) {
            dataActe.typeLigne = 'operation';
          }
          actes.push(dataActe);
        });

        result = {
          ...result,
          id_user: dataDENTALQUOTATION?.id_user,
          id_pdt: dataDENTALQUOTATION?.id_pdt,
          schemas: dataDENTALQUOTATION?.schemassss
            ? dataDENTALQUOTATION?.schemassss
            : 'both',
          couleur,
          userPreferenceQuotationColor: couleur,
          identPrat: dataDENTALQUOTATION?.ident_prat,
          adressePrat: dataDENTALQUOTATION?.DQO_ADDR_PRAT,
          id_contact: dataDENTALQUOTATION?.ident_pat,
          nom_prenom_patient: dataDENTALQUOTATION?.nom_prenom_patient,
          adresse_pat: dataDENTALQUOTATION?.adresse_pat,
          date_devis: checkDay(dataDENTALQUOTATION?.date_devis),
          date_acceptation: checkDay(dataDENTALQUOTATION?.date_acceptation),
          descriptions,
          infosCompl: descriptions[1],
          etatBucco: descriptions[0],
          quotationSignaturePatient: dataDENTALQUOTATION?.signaturePatient,
          quotationSignaturePraticien: dataDENTALQUOTATION?.signaturePraticien,
          paymentScheduleId: dataDENTALQUOTATION?.payment_schedule_id,
          reference: dataDENTALQUOTATION?.reference,
          doctorRpps: dataDENTALQUOTATION?.doctor_rpps,
          patientNumber: dataDENTALQUOTATION?.patient_number,
          patientLastname: dataDENTALQUOTATION?.patient_lastname,
          patientFirstname: dataDENTALQUOTATION?.patient_firstname,
          patientBirthday: dataDENTALQUOTATION?.patient_birthday,
          patientInsee: dataDENTALQUOTATION?.patient_insee,
          patientCivilityName: dataDENTALQUOTATION?.patient_civility_name,
          patientCivilityLongName:
            dataDENTALQUOTATION?.patient_civility_long_name,
          actes,
        };
      } catch (err) {
        throw new CBadRequestException(err);
      }
    }
    // const user = await this.userRepository.findOne({
    //   where: { id: result?.id_user },
    //   select: {
    //     password: false,
    //     passwordAccounting: false,
    //     passwordHash: false,
    //   },
    // });
    try {
      result.id_facture = 0;
      result.noFacture = '';
      // bug#254 2013-09-11 Sébastien BORDAT
      //  Récupération du taux de remboursement sécu
      // bug#337 2014-02-28 Sébastien BORDAT
      //  Taux de remboursement sécu par défaut si le taux de remboursement sécu
      //  du patient est vide
      const contactEntity = await this.contactRepository.findOne({
        where: { id: result?.id_contact || 0 },
      });
      result.socialSecurityReimbursementRate =
        contactEntity?.socialSecurityReimbursementRate
          ? toFixed(contactEntity?.socialSecurityReimbursementRate)
          : result?.userSocialSecurityReimbursementRate;
      const billEntity = await this.billRepository.findOne({
        where: { dqoId: req?.no_devis, delete: 0 },
        select: { id: true, nbr: true },
      });
      if (billEntity) {
        result.id_facture = billEntity?.id;
        result.noFacture = billEntity?.nbr;
      }

      if (req?.pdf) {
        /* En version PDF on doit transformer les chaines de caractères */
        result.identPrat = br2nl(result.identPrat);
        // result.id_contact = br2nl(result.id_contact);
        // result.nom_prenom_patient = br2nl(result.nom_prenom_patient);
        result.date_devis = br2nl(result.date_devis);
        result.adresse_pat = br2nl(result.adresse_pat);
        result.infosCompl = br2nl(result.infosCompl);
      }

      const max_long_descriptionLigne = req?.pdf ? 36 : 65;
      const max_long_dentsLigne = req?.pdf ? 7 : 8;

      result.details = [];
      result.total_prixvente = 0;
      result.total_prestation = 0;
      result.total_charges = 0;
      result.total_prixLigne = 0;
      result.total_rss = 0;
      result.total_nrss = 0;
      result.total_roc = 0;

      result?.actes.map((ar_acte) => {
        let ar_dents: string[] = [];
        let ar_descriptionLigne: string[] = [];
        if (req?.pdf) {
          ar_dents = StringHelper.trunkLine(
            ar_acte?.dentsLigne,
            max_long_dentsLigne,
            ',',
          );
          ar_descriptionLigne = StringHelper.trunkLine(
            ar_acte?.descriptionLigne,
            max_long_descriptionLigne,
          );
          ar_acte.dentsLigne = ar_dents[0];
          ar_acte.descriptionLigne = ar_descriptionLigne[0];
        }
        const prixachat = toFixed(ar_acte?.prixachat);
        const prixLigne = toFixed(ar_acte?.prixLigne);
        const prestation = toFixed(ar_acte?.prestation);
        const prixvente = toFixed(ar_acte?.prixvente);
        const rss = toFixed(ar_acte?.rss);
        const nrss = toFixed(ar_acte?.nrss);
        ar_acte.nouveau = true;
        ar_acte.prixvente = toFixed(prixachat / (1 - result?.txch));
        ar_acte.prestation = toFixed(
          prixLigne * (1 - result?.txch) - prixachat,
        );
        ar_acte.charges = prixLigne - prestation - prixvente;
        ar_acte.prixLigne = prixvente + prestation + ar_acte.charges;
        ar_acte.nrss = prixLigne - rss;
        if (Math.abs(nrss) < 0.01) ar_acte.nrss = 0;
        ar_acte.roc = 0;
        result.total_prixvente += ar_acte.prixvente;
        result.total_prestation += ar_acte.prestation;
        result.total_charges += ar_acte.charges;
        result.total_prixLigne += ar_acte.prixLigne;
        result.total_rss += rss;
        result.total_nrss += ar_acte.nrss;
        result.details.push(ar_acte);

        if (req?.pdf) {
          const pushToDetails = (
            dentsLigne: string,
            descriptionLigne: string,
          ) => {
            result.details.push({
              id_devisStd2_ligne: 0,
              typeLigne: 'operation',
              dateLigne: '00/00/0000',
              dentsLigne,
              descriptionLigne,
              materiau: '',
              cotation: '',
              prixvente: 0,
              prestation: 0,
              charges: 0,
              prixLigne: 0,
              rss: 0,
              nrss: 0,
              roc: 0,
              nouveau: false,
            });
          };

          ar_dents.forEach((dent, index) => {
            if (index > 0) {
              const descriptionLigne =
                ar_descriptionLigne.length > index
                  ? ar_descriptionLigne[index]
                  : '';
              pushToDetails(dent, descriptionLigne);
            }
          });

          const startIndex = ar_dents.length;
          ar_descriptionLigne.forEach((des, index) => {
            if (index >= startIndex) {
              pushToDetails('', des);
            }
          });
        }
      });
      result.odontogramType = 'adult';
    } catch (error) {
      throw new CBadRequestException(error.message);
    }

    if (result?.schemas !== 'none') {
      if (req?.pdf) {
        const imgPath = path.join(
          process.cwd(),
          'resources/svg/odontogram',
          'background_adult.png',
        );
        const img = fs.readFileSync(imgPath);
        const imageBase = img.toString('base64');
        function setImagePath(xml: string): string {
          const parser = new DOMParser();
          const domDocument = parser.parseFromString(xml, 'image/svg+xml');
          const texts = domDocument.getElementsByTagName('tspan');
          for (let i = 0; i < texts.length; i++) {
            texts[i].setAttribute('style', 'opacity:0');
          }
          const svg = domDocument.getElementsByTagName('svg')[0];
          const node = domDocument.getElementsByTagName('image')[0];
          svg.setAttribute('height', '269');
          svg.setAttribute('width', '643');
          node.setAttribute(
            'xlink:href',
            'data:image/jpeg;base64,' + imageBase,
          );
          const serializer = new XMLSerializer();
          return serializer.serializeToString(domDocument);
        }

        result.schemaActuel = setImagePath(
          await this.patientOdontogramService.show({
            conId: result?.id_contact,
            name: result?.odontogramType,
            status: 'current',
          }),
        );
        // Schéma actuel.
        result.schemaDevis = setImagePath(
          await this.patientOdontogramService.show({
            conId: result?.id_contact,
            name: result?.odontogramType,
            status: 'planned',
          }),
        );
      } else {
        result.schemaActuelStyles = await this.patientOdontogramService.run(
          'current',
          result?.id_contact,
        );
        result.schemaDevisStyles = await this.patientOdontogramService.run(
          'planned',
          result?.id_contact,
        );
        result.schemaActuel = '';
        result.schemaDevis = '';
      }
    }

    result.total_rss = toFixed(
      (result?.total_rss * result?.socialSecurityReimbursementRate) / 100,
    );
    result.total_roc = 0;
    result.date_signature = dayjs().format('DD/MM/YYYY');
    delete result.actes;
    return result;
  }

  //ecoophp/dental/devisStd2/devisStd2_pdf.php
  async generatePdf(req: PrintPDFDto, identity: UserIdentity) {
    try {
      const initData = await this.getInitChamps(
        { no_devis: req?.id, pdf: true },
        identity,
      );
      let color =
        initData?.couleur && initData?.couleur === 'blue' ? '#DDDDFF' : 'white';
      color =
        initData?.couleur && initData?.couleur === 'blue' ? '#EEEEEE' : color;
      // const devisStd2 = this.dentalQuotationRepository.findOne({
      //   where: { id: req?.id },
      // });

      const filePath = path.join(
        process.cwd(),
        'templates/pdf/devisStd2',
        'devisStd2.hbs',
      );

      const files: PdfTemplateFile[] = [
        {
          data: {
            couleur: initData?.couleur,
            borderBottomColor: color == 'white' ? '1px' : '0px',
            borderBottomWidth: color == 'white' ? 'black' : 'white',
          },
          path: filePath,
        },
        this.corps1(initData, true),
        this.corps2(initData, true),
        this.corps3(initData, true),
      ];

      const options: PrintPDFOptions = {
        format: 'A4',
        displayHeaderFooter: true,
        footerTemplate: '',
        margin: {
          left: '5mm',
          top: '5mm',
          right: '5mm',
          bottom: '5mm',
        },
      };

      return customCreatePdf({ files, options });
    } catch (error) {
      throw new CBadRequestException(ErrorCode.ERROR_GET_PDF);
    }
  }

  // ecoophp/dental/devisStd2/devisStd2_corps1.php
  corps1(data: DevisStd2InitRes, pdf: boolean): PdfTemplateFile {
    data.etatBucco =
      !data?.etatBucco && !pdf
        ? 'Les dents : <br/>Le parodonte : '
        : data.etatBucco;
    const filePath = path.join(
      process.cwd(),
      'templates/pdf/devisStd2',
      'devisStd2_corps1.hbs',
    );
    return {
      data: {
        pdf,
        etatBucco: data?.etatBucco,
        id_user: data?.id_user,
        adresse_pat: data?.adresse_pat,
        nom_prenom_patient: data?.nom_prenom_patient,
        date_devis: data?.date_devis,
        schemaActuel: data?.schemaActuel,
      },
      path: filePath,
    };
  }

  //ecoophp/dental/devisStd2/devisStd2_corps2.php
  corps2(data: DevisStd2InitRes, pdf: boolean): PdfTemplateFile {
    if (!data?.infosCompl && !pdf) {
      data.infosCompl = '\n\n';
    }
    const filePath = path.join(
      process.cwd(),
      'templates/pdf/devisStd2',
      'devisStd2_corps2.hbs',
    );
    return {
      data: {
        pdf,
        infosCompl: data?.infosCompl,
        nom_prenom_patient: data?.nom_prenom_patient,
        schemaDevis: data?.schemaDevis,
      },
      path: filePath,
    };
  }

  // ecoophp/dental/devisStd2/devisStd2_corps3.php
  corps3(data: DevisStd2InitRes, pdf: boolean): PdfTemplateFile {
    const filePath = path.join(
      process.cwd(),
      'templates/pdf/devisStd2',
      'devisStd2_corps3.hbs',
    );
    if (pdf) {
      data?.details.forEach((detail) => {
        detail.dentsLigne = detail.dentsLigne ? detail.dentsLigne : ' ';
        detail.descriptionLigne = detail?.descriptionLigne
          ? detail.descriptionLigne
          : ' ';
        detail.prixLigneStr = !detail?.prixLigne
          ? ' '
          : detail?.prixLigne.toString();
        detail.cotationLigne = detail.cotation;

        if (detail?.typeLigne == 'ligneBlanche') {
          detail.dentsLigne = `<!-- ${detail?.typeLigne} --> `;
          detail.descriptionLigne = `<!-- ${detail?.typeLigne} --> `;
          detail.cotationLigne = `<!-- ${detail?.typeLigne} --> `;
          detail.prixLigneStr = `<!-- ${detail?.typeLigne} --> `;
        } else if (detail.typeLigne == 'ligneSeparation') {
          detail.dentsLigne = ' ';
          detail.descriptionLigne = ' ';
          detail.cotationLigne = ' ';
          detail.prixLigneStr = ' ';
        }
      });
    }
    return {
      data: {
        pdf,
        total_prixLigne: data?.total_prixLigne,
        total_rss: data?.total_rss,
        nom_prenom_patient: data?.nom_prenom_patient,
        socialSecurityReimbursementRate: data?.socialSecurityReimbursementRate,
        details: data?.details,
        identPrat: data?.identPrat,
        adresse_prat: data?.adresse_prat,
        datedevisStd2: data?.datedevisStd2,
        quotationSignaturePraticien: data?.quotationSignaturePraticien,
        quotationSignaturePatient: data?.quotationSignaturePatient,
        hasAdresse_prat: data?.adressePrat ? true : false,
      },
      path: filePath,
    };
  }
}
