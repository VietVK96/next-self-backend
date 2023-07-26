import { Injectable } from '@nestjs/common';
import { DataSource, In, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BillLineEntity } from 'src/entities/bill-line.entity';
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
import { format } from 'date-fns';
import { PaymentPlanDeadlineEntity } from 'src/entities/payment-plan-deadline.entity';
import { DentalQuotationActEntity } from 'src/entities/dental-quotation-act.entity';
import { LettersEntity } from 'src/entities/letters.entity';

@Injectable()
export class DevisStd2Services {
  constructor(
    @InjectRepository(PlanPlfEntity)
    private planPlfRepository: Repository<PlanPlfEntity>,
    @InjectRepository(BillLineEntity)
    private paymentPlanDeadlineRepository: Repository<PaymentPlanDeadlineEntity>,
    @InjectRepository(DentalQuotationActEntity)
    private dentalQuotationActRepository: Repository<DentalQuotationActEntity>, //dental
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
    private dataSource: DataSource,
  ) {}

  async getInitChamps(userId, contactId, noPdt, noDevis, identity) {
    let idUser = identity?.id; //user id get to session
    let withs = userId; // id user to payload

    const type = EnumPrivilegeTypeType.NONE;
    if (withs !== null) {
      const privilege = await this.privilegeRepository.find({
        where: {
          usrId: idUser,
          usrWithId: In(withs),
          type: Not(type),
        },
      });
      if (privilege === null) {
        console.error(
          "Vous n'avez pas assez de privilège pour accéder aux factures",
        );
      } else {
        idUser = withs;
      }
    }
    let userPreferenceQuotationColor: string;
    let reference: string;

    let userSocialSecurityReimbursementRate: number;
    try {
      const userQuery = await this.userRepository.findOne({
        where: { id: idUser },
        relations: ['type', 'userPreferenceQuotation', 'address'],
      });
      const userType = userQuery?.type;
      const userPreferenceQuotationEntity = userQuery?.userPreferenceQuotation;
      if (userPreferenceQuotationEntity) {
        userPreferenceQuotationColor = userPreferenceQuotationEntity?.color;
      } else {
        userPreferenceQuotationColor = 'blue';
      }

      userSocialSecurityReimbursementRate =
        userQuery?.socialSecurityReimbursementRate;
      const userRateCharges = userQuery?.rateCharges;
      const userSignature = userQuery?.signature;
      const addressEntity = userQuery?.address;

      if (userType === null) {
        console.error(
          "Vous n'avez pas assez de privilège pour accéder aux factures",
        );
      }

      if (!noPdt) {
        console.error(
          "Vous n'avez pas assez de privilège pour accéder aux factures",
        );
      }

      // const medical_entete_id: number = 0;
      const formatter = new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });
      const currentDate = new Date();
      const datedevisStd2 = formatter.format(currentDate);
      const titredevisStd2 = 'Devis pour traitement bucco-dentaire';

      let txch = 0;
      const couleur = 'blue';
      const schemas = 'both';
      const quotationSignaturePatient = null;
      const quotationSignaturePraticien = null;

      if (userRateCharges) {
        txch = userRateCharges >= 1 ? userRateCharges / 100 : userRateCharges;
      }
      const userConnectedPreferenceQuotationEntity =
        await this.userPreferenceQuotationRepository.findOneBy({
          usrId: identity?.id,
        });
      let userPreferenceQuotationDisplayTooltip: number;
      if (userConnectedPreferenceQuotationEntity) {
        userPreferenceQuotationDisplayTooltip =
          userConnectedPreferenceQuotationEntity?.displayTooltip;
      } else {
        userPreferenceQuotationDisplayTooltip = 1;
      }

      const year = currentDate.getFullYear();
      const dayOfYear = String(currentDate.getDate()).padStart(3, '0');

      // Assuming you have an asynchronous function named 'executeQuery' that performs the query
      let random = await this.dataSource.query(
        `
        SELECT COALESCE(SUBSTRING(MAX(reference), -5), 0) AS reference
         FROM T_DENTAL_QUOTATION_DQO
         WHERE USR_ID = ?
        AND reference LIKE CONCAT(?, ?, '%')`,
        [userQuery?.id, year, dayOfYear],
      );
      if (random === null || random === '') {
        random = 1;
      } else {
        random = parseInt(random) + 1;
      }
      reference = year + dayOfYear + '-' + String(random).padStart(5, '0');
    } catch {
      console.error(
        "Vous n'avez pas assez de privilège pour accéder aux factures",
      );
    }

    if (noPdt !== undefined) {
      const plans = await this.planPlfRepository.findOne({
        where: { id: noPdt },
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
            group: identity?.org,
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
      const idContact = sql?.conId;

      if (withs === null || withs === undefined) {
        withs = sql?.usrId;
        if (withs === null || withs === undefined) {
          throw new CBadRequestException(
            'Un identifiant de praticien est requis',
          );
        }
      }

      const dataUser = await this.userRepository.findOne({
        where: { id: idUser },
        relations: ['address'],
      });

      const identPrat = 'Dr' + dataUser?.lastname + dataUser?.firstname;
      const adresse_prat = dataUser?.address?.city;

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
        [idContact],
      );
      if (!dataContact) {
        throw new CBadRequestException(
          'Probl&egrave;me durant le rapatriement des nom et pr&eacute;nom du patient ...',
        );
      }
      const civilite = dataContact[0]?.civilite;
      const patientLastname = dataContact[0]?.patient_lastname;
      const patientFirstname = dataContact[0]?.patient_firstname;
      const patientCivilityName = dataContact[0]?.civilite;
      let nom_prenom_patient = dataContact[0]?.nom_prenom_patient;

      if (dataContact?.civilite) {
        nom_prenom_patient = dataContact[0]?.civilite + '' + nom_prenom_patient;
        const adresse_pat = nom_prenom_patient + '\n' + dataContact[0]?.address;
        const tel = dataContact[0]?.phone;
      }
      const dataActes = await this.dataSource.query(
        `
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
    WHERE ETK.EVT_ID IN (" ? ")
    ORDER BY ETK.EVT_ID, ETK.ETK_POS
        `,
        [ids_events],
      );

      const actes = [];

      dataActes.forEach((row) => {
        row.rss = 0;
        if (row.remboursable === 'oui') {
          row.rss = row.tarif_secu;
        }
        switch (row.type) {
          case 'CCAM':
            row.cotation = row.ccamCode;
            break;
          case 'NGAP':
            row.cotation = `${row.ngap_key_name.replace(
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

      const date_devis = format(plans?.createdAt, 'dd/MM/yyyy');
      const duree_devis = '';
      const organisme = ''; //"Nom de l'organisme complémentaire";
      const contrat = ''; //"N° de contrat ou d'adhérent";
      const ref = ''; //"Référence dossier";
      const dispo = 'FALSE';
      const dispo_desc = '';
      const infosCompl = 'Les soins ne sont pas compris dans ce devis.';
      const date_acceptation = '';
      const dateSql = format(plans?.createdAt, 'yyyy/MM/dd');

      const dataPlan = await this.planPlfRepository.findOne({
        where: { id: noPdt },
      });
      const paymentScheduleStatement = dataPlan?.paymentScheduleId;
      let paymentScheduleId = dataPlan?.paymentScheduleId;
      if (
        paymentScheduleStatement !== undefined &&
        paymentScheduleStatement !== null
      ) {
        const paymentSchedule = await this.find(
          paymentScheduleId,
          identity?.org,
        );
        await this.store(identity?.org, paymentSchedule);
        paymentScheduleId = paymentSchedule?.id;
      }

      this.dataSource.transaction(async (manager) => {
        try {
          const paymentScheduleUpdate = await manager.query(
            `
              REPLACE INTO T_DENTAL_QUOTATION_DQO (USR_ID, PLF_ID, payment_schedule_id, reference, DQO_TYPE, DQO_COLOR, DQO_TITLE, DQO_IDENT_PRAT, CON_ID, DQO_IDENT_CONTACT, DQO_DATE, DQO_ADDRESS, DQO_TEL)
              VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)
              `,
            [
              userId,
              noPdt,
              paymentScheduleId || null,
              reference,
              userPreferenceQuotationColor,
              identPrat,
              identPrat,
              idContact,
              nom_prenom_patient,
              dateSql,
              adresse_prat,
              dataContact[0]?.phone,
            ],
          );

          const idDevisStd2 = paymentScheduleUpdate?.id;
          let position = 0;
          for (const acte of actes) {
            const inputParameters = [
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
            } else {
              const id_devisStd2_ligne = stmt?.insertId;
            }
          }
          const quote = await this.dentalQuotationActRepository.find({
            where: { DQOId: idDevisStd2 },
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
        } catch {
          throw new CBadRequestException('dsa');
        }
      });
    } else if (noDevis !== null) {
      try {
        const dataDENTALQUOTATION = await this.dataSource.query(
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
          [noDevis, identity?.org],
        );
        if (dataDENTALQUOTATION === null && dataDENTALQUOTATION === undefined) {
          console.error("Ce devis n'existe pas ...");
        }
        // return dataDENTALQUOTATION

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
               WHERE DQA.DQO_ID = " . ? . "
               ORDER BY DQA.DQA_POS ASC, DQA.DQA_ID ASC
          `,
          [noDevis],
        );
        let actes: string[];
        for (const dataActe of dataActes) {
          if (
            dataActe?.typeLigne === null &&
            dataActe?.typeLigne === undefined
          ) {
            dataActe.typeLigne = 'operation';
          }
          actes.push(dataActes);
        }
      } catch (err) {
        throw new CBadRequestException(err);
      }
    }

    //Todo : line 600->800 dental/devisStd2/devisStd2_init_champs.php
  }

  async find(id: number, groupId: number) {
    const paymentSchedule = await this.dataSource.query(
      `
      SELECT
                id,
                doctor_id,
                patient_id,
                label,
                amount,
                observation
            FROM payment_schedule
            WHERE id = ?
              AND group_id = ?
      `,
      [id, groupId],
    );
    if (!paymentSchedule) {
      throw new CBadRequestException('validation.in');
    }
    const lineStatement = await this.dataSource.query(
      `
      SELECT
      id,
      date,
      amount
      FROM payment_schedule_line
      WHERE payment_schedule_id = ?
      `,
      [id],
    );
    paymentSchedule.lines = lineStatement;
    return paymentSchedule;
  }

  async store(groupId: number, inputs) {
    const doctorId = inputs[0]?.doctor_id;
    const patientId = inputs[0]?.patient_id;
    const label = inputs[0]?.label;
    const amount = inputs[0]?.amount;
    const observation = inputs[0]?.observation;
    const lines = inputs?.lines;
    try {
      const lineStatement = await this.dataSource.query(
        `
        INSERT INTO payment_schedule (group_id, doctor_id, patient_id, label, amount, observation)
                VALUES (?, ?, ?, ?, ?, ?)
        `,
        [groupId, doctorId, patientId, label, amount, observation],
      );
      await this.paymentPlanDeadlineRepository.save(
        lines?.map(
          (line) =>
            ({
              paymentScheduleId: line?.id,
              dueDate: line?.date,
              amount: line?.amount,
            } as PaymentPlanDeadlineEntity),
        ),
      );
    } catch {}
  }
}
