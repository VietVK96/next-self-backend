import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MedicalHeaderEntity } from 'src/entities/medical-header.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { EventEntity } from 'src/entities/event.entity';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { PlanPlfEntity } from 'src/entities/plan-plf.entity';
import { UserEntity } from 'src/entities/user.entity';
import {
  br2nl,
  checkEmpty,
  generateFullName,
  validateEmail,
} from 'src/common/util/string';
import { UserPreferenceQuotationEntity } from 'src/entities/user-preference-quotation.entity';
import { format, getDayOfYear, getYear } from 'date-fns';
import { ContactEntity } from 'src/entities/contact.entity';
import { DentalQuotationEntity } from 'src/entities/dental-quotation.entity';
import { inseeFormatter } from 'src/common/formatter';
import { dentalFormat } from 'src/common/util/dental-format';
import { QuotesConventionDto } from '../dto/quotes.dto';
import { CmuCodificationEnum } from 'src/enum/cmu-codification-enum';
import { LibraryActEntity } from 'src/entities/library-act.entity';
import { CcamEntity } from 'src/entities/ccam.entity';
import { PatientMedicalEntity } from 'src/entities/patient-medical.entity';
import { PaymentScheduleService } from 'src/payment-schedule/services/payment-schedule.service';
import { Convention2020RequestAjaxDto } from '../dto/devis_request_ajax.dto';
import { DentalQuotationActEntity } from 'src/entities/dental-quotation-act.entity';
import { LettersEntity } from 'src/entities/letters.entity';
import {
  checkId,
  checkNumber,
  convertBooleanToNumber,
} from 'src/common/util/number';
import { PrintPDFDto } from '../dto/facture.dto';
import * as path from 'path';
import {
  PdfTemplateFile,
  PrintPDFOptions,
  customCreatePdf,
} from 'src/common/util/pdf';
import { TherapeuticAlternativeService } from './therapeuticAlternative.service';
import { ErrorCode } from 'src/constants/error';
import { checkDay } from 'src/common/util/day';
import { ContactService } from 'src/contact/services/contact.service';
import { CcamUnitPriceEntity } from 'src/entities/ccamunitprice.entity';
import { ReduceActRes, ReduceRacRes } from '../res/quotes.res';
import { TherapeuticAlternatives0Res } from '../res/therapeuticAlternative.res';
import { CcamCmuCodificationEntity } from 'src/entities/ccam-cmu-codification.entity';
import { parseJson } from 'src/common/util/json';
import { UserUserSettingRes } from 'src/auth/reponse/session.res';
import { MailTransportService } from 'src/mail/services/mailTransport.service';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as dayjs from 'dayjs';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';
import { ConfigService } from '@nestjs/config';
import { PreviewMailService } from 'src/mail/services/preview.mail.service';
import { DataMailService } from 'src/mail/services/data.mail.service';
@Injectable()
export class QuotesServices {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(MedicalHeaderEntity)
    private medicalHeaderRepository: Repository<MedicalHeaderEntity>,
    @InjectRepository(EventEntity)
    private eventRepository: Repository<EventEntity>, //event
    @InjectRepository(PlanPlfEntity)
    private planPlfRepository: Repository<PlanPlfEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(UserPreferenceQuotationEntity)
    private userPreferenceQuotationRepository: Repository<UserPreferenceQuotationEntity>,
    @InjectRepository(ContactEntity)
    private contactRepository: Repository<ContactEntity>,
    @InjectRepository(DentalQuotationEntity)
    private dentalQuotationRepository: Repository<DentalQuotationEntity>,
    @InjectRepository(LibraryActEntity)
    private libraryActRepository: Repository<LibraryActEntity>,
    @InjectRepository(DentalQuotationActEntity)
    private dentalQuotationActRepository: Repository<DentalQuotationActEntity>,
    @InjectRepository(LettersEntity)
    private lettersRepository: Repository<LettersEntity>,
    @InjectRepository(CcamUnitPriceEntity)
    private ccamUnitPriceRepository: Repository<CcamUnitPriceEntity>,
    @InjectRepository(ContactNoteEntity)
    private contactNoteRepo: Repository<ContactNoteEntity>,
    private previewMailService: PreviewMailService,
    private dataMailService: DataMailService,
    private paymentPlanService: PaymentScheduleService,
    private therapeuticAlternativeService: TherapeuticAlternativeService,
    private contactService: ContactService,
    private mailTransportService: MailTransportService,
    private configService: ConfigService,
  ) {}
  //ecoophp/dental/quotes/convention-2020/devis_email.php
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
      const filename = `Devis_${dayjs(data.date).format('YYYYMMDD')}.pdf`;
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
            content: await this.generatePdf({ id }),
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
        userId: data.userId,
        conId: data.contactId,
        date: dayjs().format('YYYY-MM-DD'),
        message: `Envoi par email du devis du ${date}`,
      });
      return {
        success: true,
      };
    } catch (error) {
      throw new CBadRequestException(ErrorCode.CANNOT_SEND_MAIL);
    }
  }

  /**
   *
   * dental/quotes/convention-2020/devis_init_champs.php
   */
  async init(payload: QuotesConventionDto, identity: UserIdentity) {
    if (!payload?.no_pdt) {
      throw new CBadRequestException(
        'Pas de plan de traitement ni de devis s&eacute;lectionn&eacute;',
      );
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // const t = await this.planPlfRepository.findOne({
      //   where: { id: payload?.no_pdt },
      // });
      const plan = await this.planPlfRepository
        .createQueryBuilder('plf')
        .leftJoinAndSelect('plf.events', 'plv')
        .leftJoinAndSelect('plv.event', 'evt')
        .leftJoinAndSelect(
          'evt.contact',
          'con',
          'con.organizationId = :organizationId',
          { organizationId: identity.org },
        )
        .andWhere('plf.id = :id', { id: payload?.no_pdt })
        .getOne();
      if (!plan) {
        throw new CBadRequestException(
          'You do not have the required permission to perform this operation',
        );
      }
      const planAppointmentCollection = plan?.events;
      if (
        !(planAppointmentCollection && planAppointmentCollection.length > 0)
      ) {
        throw new CBadRequestException(
          'You do not have the required permission to perform this operation',
        );
      }
      let idsEvents = '';
      let lastEventId = 0;
      for (const planAppointment of planAppointmentCollection) {
        lastEventId = planAppointment?.event?.id;
        idsEvents += `${lastEventId}, `;
      }
      idsEvents = idsEvents.slice(0, -2);
      const row = await this.eventRepository.find({
        where: { id: lastEventId },
      });
      if (!row) {
        throw new CBadRequestException(
          'Probl&egrave;me durant le rapatriement des informations du rendez-vous ...',
        );
      }
      const ident_pat = row[0]?.conId;
      let idUser = payload?.id_user;
      if (checkEmpty(idUser)) {
        idUser = row[0]?.usrId;
        if (checkEmpty(idUser)) {
          throw new CBadRequestException(
            'Un identifiant de praticien est requis',
          );
        }
      }
      const user = await this.userRepository.findOne({
        where: { id: idUser },
        relations: ['type', 'address'],
      });
      if (!(user && !!user?.type?.professional)) {
        throw new CBadRequestException(
          "Vous n'avez pas assez de privilège pour accéder aux factures",
        );
      }
      let ident_prat = `${user?.lastname} ${user?.firstname} \nChirurgien Dentiste`;
      let adressePrat = '';
      const adressePratUser = user?.address;
      if (adressePratUser) {
        adressePrat = `${adressePratUser?.street}\n${adressePratUser?.zipCode} ${adressePratUser?.city}\n\n`;
      }
      const userNumeroFacturant = user?.numeroFacturant;
      // const userRateCharges = user?.rateCharges;
      // const userSignature = user?.signature;
      if (!checkEmpty(userNumeroFacturant)) {
        adressePrat += `N° ADELI : ${userNumeroFacturant}`;
      }
      const medicalHeader = await this.medicalHeaderRepository.findOne({
        where: { userId: idUser },
      });
      if (medicalHeader) {
        const medicalHeaderIdentPratQuot = medicalHeader?.identPratQuot;
        if (!checkEmpty(medicalHeaderIdentPratQuot)) {
          ident_prat = this.br2nl(medicalHeaderIdentPratQuot);
          adressePrat = '';
        } else {
          ident_prat = medicalHeader?.identPrat
            ? this.br2nl(medicalHeader?.identPrat)
            : ident_prat;
          adressePrat = medicalHeader?.address
            ? this.br2nl(medicalHeader?.address)
            : adressePrat;
        }
      }
      const userPreferenceQuotation =
        await this.userPreferenceQuotationRepository.findOne({
          where: { usrId: user?.id },
        });
      const periodOfValidity = userPreferenceQuotation?.periodOfValidity;
      const quotationPlaceOfManufacture =
        userPreferenceQuotation?.placeOfManufacture;
      const quotationPlaceOfManufactureLabel =
        userPreferenceQuotation?.placeOfManufactureLabel;
      const quotationWithSubcontracting =
        userPreferenceQuotation?.withSubcontracting;
      const quotationPlaceOfSubcontracting =
        userPreferenceQuotation?.placeOfSubcontracting;
      const quotationPlaceOfSubcontractingLabel =
        userPreferenceQuotation?.placeOfSubcontractingLabel;
      const userPreferenceQuotationDisplayOdontogram =
        userPreferenceQuotation?.displayOdontogram;
      const userPreferenceQuotationDisplayDetails =
        userPreferenceQuotation?.displayAnnexe;
      const userPreferenceQuotationDisplayNotice =
        userPreferenceQuotation?.displayNotice;

      if (!checkEmpty(adressePrat)) {
        ident_prat = `${ident_prat}\n${adressePrat}`;
      }
      const year: number = getYear(new Date());
      const dayOfYear: string = String(getDayOfYear(new Date())).padStart(
        3,
        '0',
      );
      const query = `
        SELECT IFNULL(SUBSTRING(MAX(reference), -5), 0) as reference
        FROM T_DENTAL_QUOTATION_DQO
        WHERE USR_ID = ?
        AND reference LIKE CONCAT(?, ?, '%')`;
      const parameters = [user.id, year, dayOfYear];
      const result = await this.dataSource.query(query, parameters);
      const random =
        result && result[0] && result[0]?.reference
          ? parseInt(result[0].reference) + 1
          : 1;
      const reference = `${year}${dayOfYear}-${String(random).padStart(
        5,
        '0',
      )}`;

      const sql = `
      SELECT CONCAT(CON.CON_LASTNAME, ' ', CON.CON_FIRSTNAME) as 'nom_prenom_patient',
              CONCAT(CON.CON_INSEE,' ',CON.CON_INSEE_KEY) as 'INSEE',
              CON.CON_BIRTHDAY as 'birthday',
              CON.ADR_ID,
              CON.CON_MAIL as 'email',
              CONCAT(ADR.ADR_STREET, '\n', ADR.ADR_ZIP_CODE, ' ', ADR.ADR_CITY) as 'address',
              (
                  SELECT CONCAT(PHO.PHO_NBR, ' (', PTY.PTY_NAME, ')') 
                  FROM T_CONTACT_PHONE_COP COP, T_PHONE_PHO PHO, T_PHONE_TYPE_PTY PTY
                  WHERE COP.CON_ID = CON.CON_ID
                      AND COP.PHO_ID = PHO.PHO_ID
                      AND PHO.PTY_ID = PTY.PTY_ID
                  ORDER BY PTY.PTY_ID
                  LIMIT 1
              ) as "phone"
      FROM T_CONTACT_CON CON
      LEFT OUTER JOIN T_ADDRESS_ADR ADR ON ADR.ADR_ID = CON.ADR_ID
      WHERE CON.CON_ID = ?`;
      const patientInfo: any = await this.dataSource.query(sql, [ident_pat]);
      if (!patientInfo) {
        throw new CBadRequestException(
          'Probl&egrave;me durant le rapatriement des nom et pr&eacute;nom du patient ... ',
        );
      }
      const nom_prenom_patient = patientInfo?.[0]?.nom_prenom_patient;
      const INSEE = patientInfo?.INSEE
        ? inseeFormatter(patientInfo?.INSEE)
        : '';
      const date_de_naissance_patient = patientInfo?.birthday;
      const tel = patientInfo?.phone;
      // const email = patientInfo?.email;
      const adresse_pat = patientInfo?.address;

      // const quotationAmount = plan?.amount;
      // const quotationPersonRepayment = plan?.personRepayment;
      // const quotationPersonAmount = plan?.personAmount;

      // const userAmoBaseRate = user?.socialSecurityReimbursementBaseRate;
      const userAmoRate = user?.socialSecurityReimbursementRate;
      const patient = await this.contactRepository.findOne({
        where: { id: ident_pat },
      });
      let patientAmoRate = patient?.socialSecurityReimbursementRate;
      if (!patientAmoRate) {
        patientAmoRate = userAmoRate;
      } else {
        patientAmoRate = parseFloat(patientAmoRate.toString());
      }
      const queryAct = `
      SELECT
            ETK.ETK_NAME as 'libelle',
            ETK.ETK_POS as position,
            ETK.library_act_id,
            ETK.library_act_quantity_id,
                IFNULL(ETK.ETK_AMOUNT, 0) as 'honoraires',
                IFNULL(DET.DET_PURCHASE_PRICE, 0) as 'prixachat',
                DET.DET_TOOTH as 'localisation',
                DET.DET_COEF as coef,
                DET.DET_TYPE as type,
                DET.DET_CCAM_CODE as ccamCode,
                
                IFNULL(IF(DET.DET_EXCEEDING = 'N', 0, DET.DET_SECU_AMOUNT), 0) as secuAmount,
                IFNULL(DET.DET_SECU_REPAYMENT, 0) as secuRepayment,
                IFNULL(DET.DET_MUTUAL_REPAYMENT_TYPE, 1) as mutualRepaymentType,
                IFNULL(DET.DET_MUTUAL_REPAYMENT_RATE, 0) as mutualRepaymentRate,
                IFNULL(DET.DET_MUTUAL_REPAYMENT, 0) as mutualRepayment,
                IFNULL(DET.DET_MUTUAL_COMPLEMENT, 0) as mutualComplement,
                IFNULL(DET.DET_PERSON_REPAYMENT, 0) as personRepayment,
                IFNULL(DET.DET_PERSON_AMOUNT, 0) as personAmount,

                IF (DET.DET_EXCEEDING = 'N', 'non', 'oui') as remboursable,
                IFNULL(library_act_quantity.materials, library_act.materials) as materials,
                0 as 'roc',
                ngap_key.name AS ngap_key_name,
                ngap_key.unit_price AS ngap_key_unit_price
        FROM T_EVENT_TASK_ETK ETK
        LEFT OUTER JOIN library_act ON library_act.id = ETK.library_act_id
        LEFT OUTER JOIN library_act_quantity ON library_act_quantity.id = ETK.library_act_quantity_id
        LEFT OUTER JOIN T_DENTAL_EVENT_TASK_DET DET ON DET.ETK_ID = ETK.ETK_ID
        LEFT OUTER JOIN ngap_key ON ngap_key.id = DET.ngap_key_id
        WHERE ETK.EVT_ID IN (?)
        ORDER BY ETK.EVT_ID, ETK.ETK_POS
      `;
      const actes: any[] = await this.dataSource.query(queryAct, [idsEvents]);
      actes.map((acte: any, index: number) => {
        if (acte?.ngap_key_name) {
          acte.localisation = actes[Math.max(0, index - 1)].localisation;
        }
      });
      const treatmentNumbers = [0];
      actes.forEach((act, index) => {
        const label = act?.libelle;
        const nomenclature = act?.type;
        let localizations: string[] = [];
        let lastLocalization: string | undefined;
        let localization = act?.localisation;
        if (act?.localisation) {
          localizations = localization.split(',');
          localization = dentalFormat(localizations);
          if (localizations.length > 1) {
            act.libelle = `${label} (${localizations.join(',')})`;
          }
          lastLocalization = localizations[localizations.length - 1];
          if (!(lastLocalization in treatmentNumbers)) {
            treatmentNumbers[0] = (treatmentNumbers[0] || 0) + 1;
            for (const number of localizations) {
              treatmentNumbers[number] = treatmentNumbers[0];
            }
          }
        }
        actes[index].libelle = label;
        actes[index].dental_localization = localization;
        actes[index].treatment_number = localization
          ? treatmentNumbers[lastLocalization]
          : null;
        actes[index].cotation = 'NPC';
        actes[index].tarif_secu = 0;
        actes[index].rss = 0;
        switch (nomenclature) {
          case 'CCAM':
            actes[index].cotation = act?.ccamCode;
            actes[index].tarif_secu = act?.secuAmount;
            actes[index].rss = act?.secuRepayment;
            break;
          case 'NGAP':
            let ngapKeyName = act?.ngap_key_name;
            const ngapKeyUnitPrice = act?.ngap_key_unit_price;
            // Gestion des lettres clés MONACO
            switch (ngapKeyName) {
              case 'CR MC':
              case 'CV MC':
                ngapKeyName = 'C';
                break;

              case 'DR MC':
              case 'DV MC':
                ngapKeyName = 'D';
                break;

              case 'ZR MC':
              case 'ZV MC':
                ngapKeyName = 'Z';
                break;

              default:
                break;
            }
            actes[index].cotation = `${ngapKeyName} ${parseFloat(act.coef)}`;
            actes[index].tarif_secu = ngapKeyUnitPrice * parseFloat(act.coef);
            if (act?.remboursable === 'oui') {
              actes[index].rss = ngapKeyUnitPrice * act?.coef;
            }
            if (Object.values(CmuCodificationEnum).includes(ngapKeyName)) {
              actes[index].dental_localization = null;
            }
            break;
        }
        const amoAmount = parseFloat(act?.secuAmount);
        let amoRefund = (amoAmount * patientAmoRate) / 100;
        if (
          ['HBLD018', 'HBJA003', 'HBJA171', 'HBJA634'].includes(
            act?.ccamCode,
          ) ||
          (act?.ngap_key_name === 'TO' && parseFloat(act.coef) === 45)
        ) {
          amoRefund = amoAmount;
        }
        actes[index].secuRepayment = amoRefund;
        actes[index].mutualRepaymentRate = 100 - patientAmoRate;
      });
      actes.sort((act1, act2) => {
        if (act1?.treatment_number === act2?.treatment_number) {
          return act1?.position - act2?.position;
        }
        return act1?.treatment_number - act2?.treatment_number;
      });
      // const organisme = ''; //"Nom de l'organisme complémentaire";
      // const contrat = ''; //"N° de contrat ou d'adhérent";
      // const ref = ''; //"Référence dossier";
      // const dispo = false;
      // const dispo_desc = '';
      // const description = '';
      // const date_acceptation = '';

      const date = new Date(plan?.createdAt);
      const validUntil = new Date(
        date.setMonth(date.getMonth() + periodOfValidity),
      );
      const paymentScheduleStatement = await this.planPlfRepository.findOne({
        select: ['paymentScheduleId'],
        where: { id: payload?.no_pdt },
      });
      let paymentScheduleId = null;
      if (!checkEmpty(paymentScheduleStatement?.paymentScheduleId)) {
        const paymentSchedule = await this.paymentPlanService.duplicate(
          paymentScheduleStatement?.paymentScheduleId,
          identity,
        );
        paymentScheduleId = paymentSchedule?.id;
      }
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
      await queryRunner.query(
        `
      DELETE BLN, BIL
      FROM T_DENTAL_QUOTATION_DQO DQO,
              T_BILL_BIL BIL
      LEFT OUTER JOIN T_BILL_LINE_BLN BLN ON BLN.BIL_ID = BIL.BIL_ID
      WHERE DQO.PLF_ID = ?
          AND DQO.DQO_ID = BIL.DQO_ID`,
        [payload?.no_pdt],
      );

      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
      const planAmount = plan?.amount;
      const planPersonRepayment = plan?.personRepayment;
      const planPersonAmount = plan?.personAmount;
      const dentalQuotation = await queryRunner.query(
        `
      REPLACE INTO T_DENTAL_QUOTATION_DQO (
        USR_ID, 
        PLF_ID,
        payment_schedule_id,
        reference,
        DQO_TYPE, 
        DQO_SCHEMES, 
        DQO_DETAILS, 
        DQO_IDENT_PRAT, 
        CON_ID, 
        DQO_IDENT_CONTACT, 
        DQO_DATE,
        valid_until,
        DQO_ADDRESS, 
        DQO_TEL, 
        DQO_INSEE, 
        DQO_BIRTHDAY, 
        DQO_AMOUNT, 
        DQO_PERSON_REPAYMENT, 
        DQO_PERSON_AMOUNT,
        DQO_DURATION,
        DQO_PLACE_OF_MANUFACTURE,
        DQO_PLACE_OF_MANUFACTURE_LABEL,
        DQO_WITH_SUBCONTRACTING,
        DQO_PLACE_OF_SUBCONTRACTING,
        DQO_PLACE_OF_SUBCONTRACTING_LABEL,
        DQO_DISPLAY_NOTICE
      ) VALUES (?, ?, ?, ?, 4, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          payload?.id_user,
          payload?.no_pdt,
          paymentScheduleId,
          reference,
          userPreferenceQuotationDisplayOdontogram,
          userPreferenceQuotationDisplayDetails,
          ident_prat,
          ident_pat,
          nom_prenom_patient,
          format(new Date(date), 'yyyy-MM-dd'),
          format(new Date(validUntil), 'yyyy-MM-dd'),
          adresse_pat,
          tel,
          INSEE,
          date_de_naissance_patient,
          planAmount,
          planPersonRepayment,
          planPersonAmount,
          periodOfValidity,
          quotationPlaceOfManufacture,
          quotationPlaceOfManufactureLabel,
          quotationWithSubcontracting,
          quotationPlaceOfSubcontracting,
          quotationPlaceOfSubcontractingLabel,
          userPreferenceQuotationDisplayNotice,
        ],
      );
      const insertQuery = `
      INSERT INTO T_DENTAL_QUOTATION_ACT_DQA (
        DQO_ID,
        library_act_id,
        library_act_quantity_id,
        DQA_POS,
        treatment_number,
        DQA_LOCATION,
        dental_localization,
        DQA_NAME,
        DQA_MATERIAL,
        DQA_NGAP_CODE,
        DQA_PURCHASE_PRICE,
        DQA_REFUNDABLE,
        DQA_AMOUNT,
        DQA_AMOUNT_SECU,
        DQA_RSS,
        DQA_ROC,
        DQA_SECU_AMOUNT,
        DQA_SECU_REPAYMENT,
        DQA_MUTUAL_REPAYMENT_TYPE,
        DQA_MUTUAL_REPAYMENT_RATE,
        DQA_MUTUAL_REPAYMENT,
        DQA_MUTUAL_COMPLEMENT,
        DQA_PERSON_REPAYMENT,
        DQA_PERSON_AMOUNT
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const id_devis = dentalQuotation?.insertId;

      for (let index = 0; index < actes.length; index++) {
        const acte = actes[index];

        const dentalQuotationAct = await queryRunner.query(insertQuery, [
          id_devis,
          acte.library_act_id,
          acte.library_act_quantity_id,
          index,
          acte.treatment_number,
          acte.localisation,
          acte.dental_localization,
          acte.libelle,
          acte.materials,
          acte.cotation,
          acte.prixachat,
          acte.remboursable,
          acte.honoraires,
          acte.tarif_secu,
          acte.rss,
          acte.roc,
          acte.secuAmount,
          acte.secuRepayment,
          acte.mutualRepaymentType,
          acte.mutualRepaymentRate,
          acte.mutualRepayment,
          acte.mutualComplement,
          acte.personRepayment,
          acte.personAmount,
        ]);
        if (!dentalQuotationAct) {
          throw new CBadRequestException(
            'Probl&egrave;me durant la cr&eacute;ation des actes du devis ... ',
          );
        } else {
          acte.id_devis_acte = dentalQuotationAct?.insertId;
        }
      }
      queryRunner.commitTransaction();
      const quote = await this.dentalQuotationRepository.findOne({
        where: { id: id_devis },
        relations: [
          'acts',
          'user',
          'patient',
          'acts.libraryActQuantity',
          'acts.libraryActQuantity.ccam',
          'acts.libraryActQuantity.ccam.cmuCodifications',
          'acts.libraryActQuantity.ccam.teeth',
          'acts.libraryActQuantity.ccam.unitPrices',
          'acts.libraryActQuantity.ccam.family',
          'acts.libraryActQuantity.ccam.family.panier',
        ],
      });
      const libraryActs = await this.libraryActRepository.find({
        relations: ['attachments'],
      });
      const users = await this.userRepository.find({
        relations: ['medical', 'group', 'group.address', 'setting'],
      });
      const attachments = [];
      for (const quoteAct of quote?.acts) {
        const libraryAct = libraryActs.find(
          (v) => v?.id === quoteAct?.libraryActId,
        );
        if (libraryAct && libraryAct?.attachmentCount) {
          for (const attachment of libraryAct?.attachments) {
            const isExistAttachment = attachments.find(
              (v) => v?.id === attachment?.id,
            );
            const attachmentUser = users.find(
              (u) => u?.id === attachment?.usrId,
            );
            if (
              !isExistAttachment &&
              (!attachmentUser || attachmentUser?.id === quote?.user?.id)
            ) {
              attachments.push(attachment);
            }
          }
        }
      }
      const quoteUser = users.find((u) => u?.id === quote?.userId);
      quote.user = quoteUser;

      let amountTotal = 0;
      let amoAmountTotal = 0;
      let amoRefundTotal = 0;
      let patientAmountTotal = 0;

      for (const act of quote?.acts) {
        const ccam = act?.libraryActQuantity
          ? act.libraryActQuantity?.ccam
          : null;
        let maximumPrice = null;
        let panier = null;
        const listTeeth = act?.location?.split(' ') ?? [];
        if (ccam) {
          if (
            this.isCmuPatient(quote?.date, quote?.user) &&
            this.isCmuCcam(listTeeth, ccam)
          ) {
            maximumPrice =
              ccam?.cmuCodifications[0] &&
              ccam?.cmuCodifications[0]?.maximumPrice
                ? ccam.cmuCodifications[0].maximumPrice
                : null;
            panier = 4;
          } else if (act?.secuAmount) {
            const grid = quote?.user?.setting?.priceGrid ?? null;
            maximumPrice = this.getUnitPriceCcam(grid, quote?.date, ccam);
            if (ccam?.family?.panier) {
              panier = ccam?.family?.panier?.code;
            }
          }
        }
        const amount = act?.amount ? parseFloat(act?.amount?.toString()) : 0;
        const amoAmount = act?.secuAmount
          ? parseFloat(act?.secuAmount?.toString())
          : 0;
        const amoRefund = act?.secuRepayment
          ? parseFloat(act?.secuRepayment?.toString())
          : 0;
        const patientAmount = amount - amoRefund;

        amountTotal = amountTotal + amount;
        amoAmountTotal = amoAmountTotal + amoAmount;
        amoRefundTotal = amoRefundTotal + amoRefund;
        patientAmountTotal = patientAmountTotal + patientAmount;

        act['patientAmount'] = patientAmount;
        act['maximumPrice'] = maximumPrice;
        act['panier'] = panier;
        const ngapCodeArr = act?.ngapCode ? act.ngapCode.split(' ') : [];
        act.ngapCode = ngapCodeArr
          ? ngapCodeArr.reduce((code, value) => {
              if (value !== 'null') {
                return `${code} ${value}`;
              }
              return code;
            }, '')
          : '';
      }

      return {
        quote,
        attachments,
        amountTotal,
        amoAmountTotal,
        amoRefundTotal,
        patientAmountTotal,
        periodOfValidity,
        idDevis: id_devis,
      };
    } catch (error) {
      if (queryRunner?.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  br2nl(string: string): string {
    return string.replace(/<br\s*\/?>/gi, '\n');
  }

  /**
   * application/Entity/Ccam.php
   * Line: 567 -> 580
   */
  isCmuCcam(numbers: string[], ccam: CcamEntity) {
    const cmuCodifications = ccam?.cmuCodifications;
    if (!cmuCodifications) {
      return false;
    }
    const teeth = ccam?.teeth;
    return (
      !teeth ||
      teeth.some((tooth) => {
        const forbiddenTeeth = tooth?.forbiddenTeeth ?? '';
        return (
          tooth?.rank &&
          numbers[tooth?.rank] &&
          forbiddenTeeth.includes(numbers[tooth?.rank])
        );
      })
    );
  }

  getUnitPriceCcam(grid: number, date: string, ccam: CcamEntity) {
    const listPrice = ccam?.unitPrices ?? [];
    const unitPrices = listPrice?.filter(
      (price) =>
        checkNumber(price?.grid) === grid &&
        new Date(price?.createdOn).getTime() <= new Date(date).getTime(),
    );
    unitPrices.sort(
      (a, b) =>
        new Date(a?.createdOn).getTime() - new Date(b?.createdOn).getTime(),
    );
    if (unitPrices && unitPrices?.length > 0) {
      return unitPrices[0]?.maximumPrice;
    }
    return null;
  }

  /**
   * /application/Entity/Patient.php
   * Line 805-> 820
   */
  isCmuPatient(datetime: string, patient: ContactEntity) {
    const activeCmu = this.getActiveAmcPatient(datetime, patient);
    const medical = patient?.medical;
    if (activeCmu) {
      return !!activeCmu?.isCmu;
    }
    if (medical) {
      return this.isActiveAcsMedicalPatient(medical);
    }
    return false;
  }

  /**
   * /application/Entity/Patient.php
   * Line 599-> 610
   */
  getActiveAmcPatient(datetime: string, patient: ContactEntity) {
    const listAmcs = patient?.amcs ?? [];
    const amcs = listAmcs.map((amc) => {
      if (
        (!amc?.startDate ||
          new Date(amc?.startDate).getTime() <= new Date(datetime).getTime()) &&
        (!amc?.endDate ||
          new Date(amc?.endDate).getTime() >= new Date(datetime).getTime())
      ) {
        return amc;
      }
    });
    if (!checkEmpty(amcs)) {
      return amcs[0];
    }
    return null;
  }

  /**
   * /application/Entity/PatientMedical.php
   * Line: 152 -> 157
   */
  isActiveAcsMedicalPatient(medical: PatientMedicalEntity) {
    const now = new Date();
    return (
      ['11', '12', '13', '14'].includes(medical?.serviceAmoCode) &&
      (!medical?.serviceAmoStartDate ||
        now.getTime() >= new Date(medical?.serviceAmoStartDate).getTime()) &&
      (!medical?.serviceAmoEndDate ||
        now.getTime() <= new Date(medical?.serviceAmoEndDate).getTime())
    );
  }

  /**
   * /dental/quotes/convention-2020/devis_requetes_ajax.php
   * Line: 1 -> 452
   */
  async devisRequestAjax(params: Convention2020RequestAjaxDto, id: number) {
    try {
      const data = await this.dentalQuotationRepository.findOne({
        where: { id: id },
        relations: ['acts', 'attachments', 'contact', 'user', 'treatmentPlan'],
      });
      const dataIdActs = data?.acts.map((dataActs) => {
        let material = null;
        if (params?.acts.some((act) => act.id === dataActs.id)) {
          material = dataActs?.material;
        }
        return {
          id: dataActs?.id,
          material,
        };
      });
      for (const dataIdAct of dataIdActs) {
        await this.dentalQuotationActRepository.update(dataIdAct?.id, {
          material: dataIdAct?.material,
        });
      }

      if (data?.attachments.length > 0) {
        const dataIdAc = data?.attachments.map(
          (attachments) => (id = attachments?.id),
        );
        if (dataIdAc) {
          await this.lettersRepository.delete(dataIdAc);
        }
      }

      for (const attach of params?.attachments) {
        const mail = attach?.id;
        let context: number[];
        let signature: string;
        if (data) {
          const doctor_id = data?.user?.id;
          const patient_id = data?.contact?.id;
          context.push(patient_id, doctor_id);
        }
        if (data?.signaturePraticien) {
          signature = data?.signaturePraticien;
        }
        if (data?.signaturePatient) {
          signature = data?.signaturePatient;
        }

        const mailConverted = await this.previewMailService.transform(
          mail,
          context,
          signature,
        );
        mailConverted.doctor.id = data?.user?.id;
        mailConverted.patient.id = data?.contact?.id;

        if (mailConverted.header) {
          mailConverted.Body =
            '<div class="page_header">' +
            mailConverted.header.Body +
            '</div>' +
            mailConverted.Body;
        }
        delete mailConverted.header;
        delete mailConverted.footer;

        const sendMail = await this.dataMailService.store(mailConverted);

        await this.lettersRepository.update(sendMail?.id, {
          quoteId: data?.id,
        });
      }
      const print_explanatory_note = convertBooleanToNumber(
        params?.print_explanatory_note,
      );
      await this.dentalQuotationRepository.update(id, {
        date: params?.date,
        validUntil: params?.valid_until,
        dateAccept: params?.accepted_on || null,
        msg: params?.description,
        placeOfManufacture: params?.place_of_manufacture,
        placeOfSubcontracting: params?.place_of_subcontracting,
        displayNotice: print_explanatory_note,
        signaturePatient: params?.patient_signature,
        signaturePraticien: params?.user_signature,
      } as DentalQuotationEntity);

      if (data?.treatmentPlan && data?.dateAccept) {
        const treatmentPlan = data?.treatmentPlan?.id;
        await this.planPlfRepository.update(treatmentPlan, {
          acceptedOn: data?.dateAccept,
        });
      }
      return 'test';
    } catch (err) {
      return new CBadRequestException(err);
    }
  }

  /**
   * ecoophp/dental/quotes/convention-2020/devis_pdf.php
   * Line: 23-92
   */
  async generatePdf(req: PrintPDFDto) {
    try {
      const id = checkId(req?.id);
      const quote = await this.dentalQuotationRepository.findOne({
        where: {
          id: id || 0,
        },
        relations: {
          acts: {
            libraryActQuantity: {
              ccam: {
                cmuCodifications: true,
              },
            },
          },
          user: {
            medical: true,
            setting: true,
            group: {
              address: true,
            },
          },
          patient: {
            amcs: true,
          },
          paymentPlan: {
            deadlines: true,
          },
        },
      });
      if (!quote) {
        throw new CBadRequestException(ErrorCode.NOT_FOUND_QUOTE);
      }

      const therapeuticAlternatives =
        await this.therapeuticAlternativeService.getTherapeuticAlternative(
          quote,
        );

      const insee = inseeFormatter(
        quote?.patient?.insee + ' ' + quote?.patient?.inseeKey,
      );
      const isInEuropean =
        (quote.placeOfManufacture & 1) === 1 ||
        (quote.placeOfManufacture & 2) === 2;
      const notInEuropean = (quote.placeOfManufacture & 4) === 4;
      const acts = await this._reduceAct(quote);
      const rac0 = await this._reduceRac(therapeuticAlternatives?.rac0, quote);
      const racm = await this._reduceRac(therapeuticAlternatives?.racm, quote);
      const userSetting = parseJson<UserUserSettingRes>(quote?.user?.settings);
      const isPrintAdditional =
        userSetting?.printAdditionalPatientInformation &&
        this.isCmuPatient(checkDay(quote?.date), quote?.patient);

      const data = {
        quote: {
          ...quote,
          date: checkDay(quote?.date),
          validUntil: checkDay(quote?.validUntil),
          acceptedOn: checkDay(quote?.dateAccept),
          description: br2nl(quote?.msg),
          patient: {
            ...quote.patient,
            birthDate: checkDay(quote?.patient?.birthDate),
          },
          user: {
            ...quote?.user,
            setting: {
              currency: '€',
            },
          },
        },
        acts,
        rac0,
        racm,
        insee,
        isInEuropean,
        notInEuropean,
        therapeuticAlternatives,
        isPrintAdditional,
      };

      const filePath = path.join(
        process.cwd(),
        'templates/pdf/2020',
        'convention_2020.hbs',
      );
      const files: PdfTemplateFile[] = [
        {
          data,
          path: filePath,
        },
      ];

      const helpers = {
        formatDate: (date: string) => {
          return checkDay(date, 'DD/MM/YYYY');
        },
      };

      const options: PrintPDFOptions = {
        format: 'A4',
        displayHeaderFooter: true,
        footerTemplate: '<div></div>',
        headerTemplate: '<div></div>',
        margin: {
          left: '5mm',
          top: '5mm',
          right: '5mm',
          bottom: '10mm',
        },
      };
      return customCreatePdf({ files, options, helpers });
    } catch {
      throw new CBadRequestException(ErrorCode.ERROR_GET_PDF);
    }
  }

  /**
   *  ecoophp/resources/views/quotes/convention_2020/index.html.twig
   *  @line 469 - 478
   * @param rac0s : TherapeuticAlternatives0Res[]
   * @param quote : DentalQuotationEntity
   *
   * @returns ReduceRacRes[]
   */
  async _reduceRac(
    rac0s: TherapeuticAlternatives0Res[],
    quote: DentalQuotationEntity,
  ): Promise<ReduceRacRes[]> {
    const result: ReduceRacRes[] = [];
    for await (const rac0 of rac0s) {
      let unitPrice: CcamCmuCodificationEntity;
      if (
        this.isCmuPatient(checkDay(quote?.date), quote?.patient) &&
        this.isCmuCcam(
          rac0?.act?.location?.split(','),
          rac0?.act?.libraryActQuantity,
        )
      ) {
        unitPrice = rac0?.ccam?.cmuCodifications[0];
      } else {
        unitPrice = await this._getUnitPrice(
          quote?.user?.setting?.priceGrid,
          checkDay(quote?.date),
          rac0?.act?.libraryActQuantity?.ccam,
        );
      }
      const maximumPrice = unitPrice?.maximumPrice;
      const amoAmount = unitPrice?.unitPrice;
      const amoRefund =
        (checkNumber(unitPrice?.unitPrice) *
          (100 - checkNumber(rac0.act.amcRefundRate))) /
        100;
      const amoAmountRefund =
        (maximumPrice ? maximumPrice : amoAmount) - amoRefund;
      result.push({
        amoAmount,
        amoAmountRefund,
        amoRefund,
        code: rac0?.ccam?.code,
        dentalLocalization: rac0?.act?.dentalLocalization,
        madeByPractitioner: rac0?.madeByPractitioner,
        materialCode: rac0?.ccam?.material?.code,
        maximumPrice,
        shortName: rac0?.ccam?.shortName,
        treatmentNumber: rac0?.act?.treatmentNumber,
      });
    }
    return result;
  }

  /**
   * ecoophp/resources/views/quotes/convention_2020/index.html.twig
   * @Line: 341 - 362
   * @param quote : DentalQuotationEntity
   * @returns ReduceActRes
   */
  async _reduceAct(quote: DentalQuotationEntity): Promise<ReduceActRes> {
    const result: ReduceActRes = {
      amountTotal: 0,
      amoAmountTotal: 0,
      amoRefundTotal: 0,
      patientAmountTotal: 0,
      acts: [],
    };
    for await (const act of quote?.acts) {
      let maximumPrice: number | null = null;
      let panier: string | null = null;
      if (
        this.contactService.isCmu(quote?.date, quote?.patient) &&
        this.isCmuCcam(act?.location?.split(','), act?.libraryActQuantity)
      ) {
        maximumPrice = checkNumber(
          act?.libraryActQuantity?.ccam?.cmuCodifications[0].maximumPrice,
        );
        panier = '4';
      } else if (act?.secuAmount) {
        const unitPrice = await this._getUnitPrice(
          quote?.user?.setting?.priceGrid,
          checkDay(quote?.date),
          act?.libraryActQuantity?.ccam,
        );
        maximumPrice = checkNumber(unitPrice?.maximumPrice);
        panier = act?.libraryActQuantity?.ccam?.family?.panier?.code;
      }
      const amount = checkNumber(act?.amount);
      const amoAmount = checkNumber(act?.secuAmount);
      const amoRefund = checkNumber(act?.secuRepayment);
      const patientAmount = amount - amoRefund;

      result.amountTotal += amount;
      result.amoAmountTotal += amoAmount;
      result.amoRefundTotal += amoRefund;
      result.patientAmountTotal += patientAmount;
      result.acts.push({
        amoAmount,
        amoRefund,
        amount,
        cotation: act?.ngapCode,
        dentalLocalization: act?.dentalLocalization,
        materials: act?.materials,
        maximumPrice,
        panier,
        patientAmount: amount - amoRefund,
        treatmentNumber: act?.treatmentNumber,
        label: act?.name,
      });
    }

    return result;
  }

  /**
   *
   * @param grid ; number
   * @param date : string
   * @param ccam : CcamEntity
   * @returns CcamUnitPriceEntity | null
   */
  async _getUnitPrice(
    grid: number,
    date: string,
    ccam: CcamEntity,
  ): Promise<CcamUnitPriceEntity | null> {
    const temp = await this._createActiveCriteria(grid, date);
    const unitPrices =
      ccam?.unitPrices.filter((price) => price?.id === temp?.id) || [];
    if (unitPrices.length) {
      return unitPrices[0];
    }
    return null;
  }

  /**
   * ecoophp/application/Repository/CcamUnitPriceRepository.php
   * @line 24 - 31
   * @param grid :number
   * @param date : string
   * @returns CcamUnitPriceEntity | null
   */
  async _createActiveCriteria(
    grid: number,
    date: string,
  ): Promise<CcamUnitPriceEntity> {
    return this.ccamUnitPriceRepository.findOne({
      where: {
        grid,
        createdOn: date,
      },
      order: {
        createdOn: 'DESC',
      },
    });
  }
}
