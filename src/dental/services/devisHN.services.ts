import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { add, startOfMonth } from 'date-fns';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { customDayOfYear } from 'src/common/util/day';
import { generateFullName, validateEmail } from 'src/common/util/string';
import { DentalQuotationEntity } from 'src/entities/dental-quotation.entity';
import { PlanEventEntity } from 'src/entities/plan-event.entity';
import { PlanPlfEntity } from 'src/entities/plan-plf.entity';
import { UserPreferenceQuotationDisplayOdontogramType } from 'src/entities/user-preference-quotation.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { DevisHNGetInitChampDto, DevisHNPdfDto } from '../dto/devisHN.dto';
import { MedicalHeaderEntity } from 'src/entities/medical-header.entity';
import { ContactEntity } from 'src/entities/contact.entity';
import * as dayjs from 'dayjs';
import { PaymentScheduleService } from 'src/payment-schedule/services/payment-schedule.service';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { extname } from 'path';
import { UploadEntity } from 'src/entities/upload.entity';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { DentalQuotationActEntity } from 'src/entities/dental-quotation-act.entity';
import { PatientOdontogramService } from 'src/patient/service/patientOdontogram.service';
import { customCreatePdf } from 'src/common/util/pdf';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { checkId } from 'src/common/util/number';
import { ErrorCode } from 'src/constants/error';
import { MailTransportService } from 'src/mail/services/mailTransport.service';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';
import { DOMParser, XMLSerializer } from 'xmldom';
import { generateBarcode } from 'src/common/util/image';
import { DataMailService } from 'src/mail/services/data.mail.service';
import { PdfMailService } from 'src/mail/services/pdf.mail.service';
import { TemplateMailService } from 'src/mail/services/template.mail.service';
import { PreviewMailService } from 'src/mail/services/preview.mail.service';

@Injectable()
export class DevisServices {
  constructor(
    private dataMailService: DataMailService,
    private pdfMailService: PdfMailService,
    private templateMailService: TemplateMailService,
    private previewMailService: PreviewMailService,
    private paymentScheduleService: PaymentScheduleService,
    private odotogramService: PatientOdontogramService,
    private configService: ConfigService,
    @InjectRepository(DentalQuotationEntity)
    private dentalQuotationRepository: Repository<DentalQuotationEntity>,
    @InjectRepository(DentalQuotationActEntity)
    private dentalQuotationActRepository: Repository<DentalQuotationActEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(PlanPlfEntity)
    private planRepository: Repository<PlanPlfEntity>,
    @InjectRepository(MedicalHeaderEntity)
    private medicalHeaderRepository: Repository<MedicalHeaderEntity>,
    @InjectRepository(ContactEntity)
    private patientRepository: Repository<ContactEntity>,
    @InjectRepository(OrganizationEntity)
    private organizationRepository: Repository<OrganizationEntity>,
    @InjectRepository(UploadEntity)
    private uploadRepository: Repository<UploadEntity>,
    @InjectRepository(ContactNoteEntity)
    private contactNoteRepo: Repository<ContactNoteEntity>,
    private dataSource: DataSource,
    private mailTransportService: MailTransportService,
  ) {}

  // dental/devisHN/devisHN_email.php (line 1 - 91)
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
      const filename = `Devis_${data.reference ? data.reference : ''}.pdf`;
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
            content: await this.generatePDF(identity, { no_devis: id }),
          },
        ],
      });

      if (data?.treatmentPlan?.id) {
        await this.planRepository.save({
          ...data.treatmentPlan,
          sentToPatient: 1,
          sendingDateToPatient: dayjs().format('YYYY-MM-DD'),
        });
      }

      await this.contactNoteRepo.save({
        conId: data.contactId,
        message: `Envoi par email du devis ${data.reference}.`,
      });

      return {
        success: true,
      };
    } catch (error) {
      throw new CBadRequestException(ErrorCode.CANNOT_SEND_MAIL);
    }
  }

  // ecoophp/dental/devisHN/devisHN_init_champs.php
  async getInitChamps(
    user: UserIdentity,
    { no_pdt, no_devis }: DevisHNGetInitChampDto,
    pdf?: string,
  ) {
    const currentUser = await this.userRepository.findOne({
      where: { id: user?.id },
      relations: {
        type: true,
        address: true,
        userPreferenceQuotation: true,
      },
    });
    try {
      const userTypeEntity = currentUser?.type;
      const userTypeProfessional = userTypeEntity.professional;

      const userPreferenceQuotationEntity =
        currentUser?.userPreferenceQuotation;

      if (!userPreferenceQuotationEntity) {
        currentUser.userPreferenceQuotation = {
          color: 'blue',
          treatmentTimeline: 0,
          displayOdontogram: UserPreferenceQuotationDisplayOdontogramType.NONE,
        };
      }
      if (!userTypeProfessional)
        throw new CBadRequestException(
          "Vous n'avez pas assez de privilège pour accéder aux factures",
        );
    } catch (err) {
      throw new CBadRequestException(
        `Vous n\'avez pas assez de privilège pour accéder aux factures`,
      );
    }

    if (!no_pdt && !no_devis) {
      throw new CBadRequestException(
        `Pas de plan de traitement ni de devis s&eacute;lectionn&eacute;`,
      );
    }

    const groupId = user.org;
    let titreDevisHN = 'Devis pour traitement bucco-dentaire';
    let txch = 0;
    const couleur = 'blue';
    const schemas = 'none';
    const quotationSignaturePatient = null;
    const quotationSignaturePraticien = null;

    if (!currentUser?.userPreferenceQuotation?.id) {
      currentUser.userPreferenceQuotation.periodOfValidity = 6;
      currentUser.userPreferenceQuotation.displayTooltip = 1;
    }

    const year = new Date().getFullYear();
    const dayOfYear = customDayOfYear(dayjs());
    let random = await this.dataSource.query(
      `
    SELECT IFNULL(SUBSTRING(MAX(reference), -5), 0) reference
    FROM T_DENTAL_QUOTATION_DQO
    WHERE USR_ID = ? 
    AND reference LIKE CONCAT(?, ?, '%')`,
      [currentUser.id, year, dayOfYear],
    );
    random = Number(random[0]?.reference ? random[0]?.reference : '0') + 1;
    const paddedRandom = random.toString().padStart(5, '0');
    const reference = `${year}${dayOfYear}-${paddedRandom}`;
    let res;
    if (no_pdt) {
      try {
        const plan = await this.planRepository.findOne({
          where: {
            id: no_pdt,
            events: {
              event: {
                contact: {
                  group: groupId,
                },
              },
            } as FindOptionsWhere<PlanEventEntity>,
          },
          relations: {
            events: {
              event: {
                contact: {},
              },
            },
          },
        });
        if (!plan?.events?.length)
          throw new CBadRequestException(
            'You do not have the required permission to perform this operation',
          );

        const last_event = plan?.events[plan.events.length - 1]?.event;
        const ids_events = plan?.events
          ?.map((event) => {
            return event.evtId;
          })
          .join(',');

        const id_contact = last_event?.conId;
        const id_user = last_event?.usrId;
        if (!id_user)
          throw new CBadRequestException(
            'Un identifiant de praticien est requis',
          );
        let identPrat = `${currentUser?.lastname} ${currentUser?.firstname} \nChirurgien Dentiste`;
        let adressePrat = '';
        if (currentUser?.address) {
          const address = currentUser.address;
          adressePrat += `${address.street} \n ${address.zipCode} ${address.city} \n\n`;
        }
        if (currentUser?.rateCharges) {
          txch =
            currentUser.rateCharges >= 1
              ? currentUser.rateCharges / 100
              : currentUser.rateCharges;
        }
        let infosCompl = `Les soins ne sont pas compris dans ce devis.`;
        const medicalHeader = await this.medicalHeaderRepository.findOne({
          where: { userId: currentUser?.id },
        });
        let medical_entete_id;
        if (medicalHeader) {
          medical_entete_id = medicalHeader?.id;
          identPrat = medicalHeader?.identPrat
            ? medicalHeader.identPrat?.replace(/<br\s*[\/]?>/gi, '\n')
            : identPrat;
          adressePrat = medicalHeader?.address
            ? medicalHeader.address?.replace(/<br\s*[\/]?>/gi, '\n')
            : adressePrat;
          infosCompl =
            medicalHeader.dentalQuotationMessage !== null
              ? medicalHeader.dentalQuotationMessage.replace(
                  /<br\s*[\/]?>/gi,
                  '\n',
                )
              : infosCompl;
          titreDevisHN = medicalHeader.nameQuotHN ?? titreDevisHN;
        }

        if (
          currentUser?.freelance &&
          !identPrat?.match(new RegExp('/("Entrepreneur Individuel"|"EI")/'))
        ) {
          identPrat = identPrat.replace(
            new RegExp(`/(${currentUser.lastname} ${currentUser.firstname})/`),
            '$1 "EI"',
          );
        } else if (
          !currentUser?.freelance &&
          identPrat?.match(new RegExp('/("Entrepreneur Individuel"|"EI")/'))
        ) {
          identPrat = identPrat.replace(
            new RegExp('/("Entrepreneur Individuel"|"EI")/'),
            '',
          );
        }

        let currentPatient = await this.dataSource.query(`
        SELECT 
        CON.CON_NBR number,
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
                WHERE CON.CON_ID = ${id_contact}
        `);

        if (!currentPatient?.length) {
          throw new CBadRequestException(
            'Probl&egrave;me durant le rapatriement des nom et pr&eacute;nom du patient ... ',
          );
        }
        currentPatient = currentPatient?.[0];
        const patientLastname = currentPatient?.patient_lastname;
        const patientFirstname = currentPatient?.patient_firstname;
        const patientCivilityName = currentPatient?.civilite;
        let nom_prenom_patient = currentPatient?.nom_prenom_patient;
        if (patientCivilityName !== null)
          nom_prenom_patient =
            patientCivilityName + ' ' + (nom_prenom_patient || '');
        const INSEE = currentPatient?.INSEE;
        const date_de_naissance_patient =
          currentPatient?.birthday !== null
            ? dayjs(currentPatient?.birthday).format('DD/MM/YYYY')
            : '';
        const tel = currentPatient?.phone;
        const customerNumber = currentPatient?.number;
        const email = currentPatient?.email;
        const adresse_pat = currentPatient?.address;
        const quotationPersonRepayment = plan?.personRepayment;
        const estimatedMonthTreatment = startOfMonth(new Date(plan?.createdAt));

        const actes = await this.dataSource.query(`
            SELECT ETK.ETK_ID as 'id_devisHN_ligne',
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
              'operation' as 'typeLigne',
              IFNULL(library_act_quantity.descriptive_text, library_act.descriptive_text) as descriptive_text
        FROM T_EVENT_TASK_ETK ETK
        LEFT OUTER JOIN T_DENTAL_EVENT_TASK_DET DET ON DET.ETK_ID = ETK.ETK_ID
        LEFT OUTER JOIN ngap_key ON ngap_key.id = DET.ngap_key_id
        LEFT OUTER JOIN library_act ON library_act.id = ETK.library_act_id
        LEFT OUTER JOIN library_act_quantity ON library_act_quantity.id = ETK.library_act_quantity_id
        WHERE ETK.EVT_ID IN (${ids_events})
        ORDER BY ETK.EVT_ID, ETK.ETK_POS
      `);

        for (const acte of actes) {
          if (acte?.dentsLigne)
            acte.descriptionLigne = `\nDents concernées : ${acte?.dentsLigne}`;
          acte.rss = 0;
          if (acte?.remboursable === 'oui') acte.rss = acte?.tarif_secu;

          switch (acte?.type) {
            case 'CCAM':
              acte.cotation = acte.ccamCode;
              break;
            case 'NGAP':
              acte.cotation = `${(acte.ngap_key_name ?? '').replace(
                new RegExp('/^(C|D|Z)(R|V) MC/i'),
                '$1',
              )} ${acte?.coef}`;
              break;
            default:
              acte.cotation = 'NPC';
              break;
          }
          // todo  ($pdf is unknown)
          //   if (isset($pdf)) {
          //     $acte = array_map('utf8_decode', $row);
          // } else {
          //     $acte = $row;

          acte.estimatedMonthTreatment = dayjs(estimatedMonthTreatment).format(
            'YYYY-MM',
          );
          add(estimatedMonthTreatment, { months: 1 });
        }

        const date_devis = dayjs(plan?.createdAt).format('YYYY/MM/DD');
        const duree_devis =
          currentUser?.userPreferenceQuotation?.periodOfValidity;
        const organisme = '',
          ref = '',
          contrat = '',
          dispo = false,
          dispo_desc = '',
          date_acceptation = '';
        const dateSql = dayjs(date_devis)?.format('YYYY-MM-DD');
        let paymentScheduleId = plan.paymentScheduleId;
        if (paymentScheduleId) {
          const paymentSchedule = await this.paymentScheduleService.duplicate(
            paymentScheduleId,
            user,
          );
          paymentScheduleId = paymentSchedule?.id;
        }
        const organization = await this.organizationRepository.findOne({
          where: { id: user.org },
          relations: { logo: true },
        });
        let logoId = null;
        let logoFilename = null;
        let logo = organization?.logo;
        let filename = '',
          extension = '';
        if (logo) {
          filename = logo.fileName;
          extension = extname(filename);
          const dir = await this.configService.get('app.uploadDir');
          logo.fileName = `${dir}/${logo.token}${extension}`;
          logo = await this.uploadRepository.save(logo);
          logoFilename = logo?.fileName;
          logoId = logo?.id;
          if (fs.existsSync(filename)) {
            fs.copyFile(`${filename}`, `${logo?.fileName}`, (err) => {
              console.log('-----data-----', err);
            });
          }
        }

        const quote = await this.dentalQuotationRepository.findOne({
          where: {
            treatmentPlan: {
              id: no_pdt,
            },
          },
          relations: {
            treatmentPlan: true,
          },
        });

        if (quote && quote?.logo) {
          const count = await this.dentalQuotationRepository?.count({
            where: {
              logoId: quote?.logo?.id,
            },
          });
          if (count >= 2) quote.logo = null;
          await this.dentalQuotationRepository.delete(quote?.id);
        }
        let id_devisHN = 0;
        await this.dataSource.transaction(async (manager) => {
          const dataReplace = await manager.query(
            `
            REPLACE INTO T_DENTAL_QUOTATION_DQO (
              USR_ID,
              PLF_ID,
              logo_id,
              payment_schedule_id,
              DQO_TYPE,
              reference,
              DQO_COLOR,
              DQO_SCHEMES,
              DQO_TITLE,
              DQO_IDENT_PRAT,
              DQO_ADDR_PRAT,
              CON_ID,
              DQO_IDENT_CONTACT,
              customer_number,
              DQO_DATE,
              DQO_TEL,
              DQO_AMOUNT,
              DQO_PERSON_REPAYMENT,
              DQO_PERSON_AMOUNT,
              DQO_DURATION)
          VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
          `,
            [
              id_user,
              no_pdt,
              logoId,
              paymentScheduleId ?? null,
              reference,
              currentUser?.userPreferenceQuotation?.color,
              currentUser.userPreferenceQuotation?.displayOdontogram,
              titreDevisHN,
              identPrat,
              adressePrat,
              id_contact,
              nom_prenom_patient,
              customerNumber,
              dateSql,
              tel,
              plan?.amount,
              plan?.personRepayment,
              plan?.personAmount,
              duree_devis,
            ],
          );

          id_devisHN = dataReplace?.insertId;
          const newDQAs = actes?.map((acte, index) => {
            return {
              DQOId: id_devisHN,
              libraryActId: acte?.library_act_id,
              libraryActQuantityId: acte?.library_act_quantity_id,
              location: acte?.dentsLigne,
              name: acte?.descriptionLigne,
              descriptiveText: acte?.descriptive_text,
              material: acte?.materiau,
              ngapCode: acte?.cotation,
              refundable: acte?.remboursable,
              amount: acte?.prixLigne,
              amountSecu: acte?.tarif_secu,
              rss: acte?.rss,
              roc: acte?.roc,
              type: 'operation',
              pos: index + 1,
              secuAmount: acte?.secuAmount,
              secuRepayment: acte?.secuRepayment,
              mutualRepaymentType: acte?.mutualRepaymentType,
              mutualRepaymentRate: acte?.mutualRepaymentRate,
              mutualRepayment: acte?.mutualRepayment,
              mutualComplement: acte?.mutualComplement,
              personRepayment: acte?.personRepayment,
              personAmount: acte?.personAmount,
              estimatedMonthTreatment: acte?.estimatedMonthTreatment,
            } as DentalQuotationActEntity;
          });
          await manager.save(DentalQuotationActEntity, newDQAs);
        });
        res = {
          id_user,
          id_contact,
          id_devisHN,
          id_pdt: no_pdt,
          medical_entete_id,
          titreDevisHN,
          couleur,
          schemas,
          quotationSignaturePatient,
          quotationSignaturePraticien,
          reference,
          identPrat,
          adressePrat,
          txch,
          infosCompl,
          patientLastname,
          patientFirstname,
          patientCivilityName,
          nom_prenom_patient,
          INSEE,
          date_de_naissance_patient,
          tel,
          customerNumber,
          email,
          adresse_pat,
          quotationPersonRepayment,
          date_devis,
          duree_devis,
          organisme,
          paymentScheduleId,
          actes,
          logoId,
          logoFilename,
          userPreferenceQuotation: currentUser?.userPreferenceQuotation,
          userType: currentUser?.type,
          date_acceptation: date_acceptation,
          contrat,
          ref,
          dispo,
          dispo_desc,
          quotationAmount: plan?.amount,
          quotationPersonAmount: plan?.personAmount,
          patientInsee: currentPatient?.INSEE,
        };
      } catch (err) {
        throw new CBadRequestException(err);
      }
    } else if (no_devis) {
      try {
        const row = await this.dataSource.query(
          `
                      SELECT DQO.USR_ID as id_user,
                      DQO.PLF_ID as id_pdt,
                      DQO.CON_ID as ident_pat,
                      DQO.payment_schedule_id,
                      DQO.reference,
                      DQO.DQO_COLOR as couleur,
                      DQO.DQO_SCHEMES as 'schemas',
                      DQO.DQO_TITLE as titreDevisHN,
                      DATE_FORMAT(DQO.DQO_DATE_ACCEPT, '%d/%m/%Y') as date_acceptation,
                      DATE_FORMAT(DQO.DQO_BIRTHDAY, '%d/%m/%Y') as date_de_naissance_patient,
                      DATE_FORMAT(DQO.DQO_DATE, '%Y/%m/%d') as date_devis,
                      DQO.DQO_IDENT_PRAT as ident_prat,
                      DQO.DQO_ADDR_PRAT as addr_prat,
                      DQO.DQO_IDENT_CONTACT as nom_prenom_patient,
                      DQO.DQO_DURATION as duree_devis,
                      DQO.customer_number customerNumber,
                      DQO.DQO_INSEE as INSEE,
                      DQO.DQO_ADDRESS as adresse_pat,
                      DQO.DQO_TEL as tel,
                      DQO.DQO_ORGANISM as organisme,
                      DQO.DQO_CONTRACT as contrat,
                      DQO.DQO_REF as ref,
                      DQO.DQO_DISPO as dispo,
                      DQO.DQO_DISPO_MSG as dispo_desc,
                      DQO.DQO_MSG as description,
                      DQO.DQO_AMOUNT as amount,
                      DQO.DQO_PERSON_REPAYMENT as personRepayment,
                      DQO.DQO_PERSON_AMOUNT as personAmount,
                      DQO.DQO_SIGNATURE_PATIENT as signaturePatient,
                      DQO.DQO_SIGNATURE_PRATICIEN as signaturePraticien,
                      user_medical.rpps_number as practitionerRpps,
                      UPL.UPL_ID logoId,
                      UPL.UPL_FILENAME logoFilename,
                      T_CONTACT_CON.CON_LASTNAME AS patient_lastname,
                      T_CONTACT_CON.CON_FIRSTNAME AS patient_firstname,
                      CONCAT(T_CONTACT_CON.CON_INSEE, T_CONTACT_CON.CON_INSEE_KEY) AS patient_insee,
                      T_GENDER_GEN.GEN_NAME AS patient_civility_name,
                      T_GENDER_GEN.long_name AS patient_civility_long_name
              FROM T_DENTAL_QUOTATION_DQO DQO
              JOIN T_USER_USR USR
              JOIN user_medical
              JOIN T_CONTACT_CON
              LEFT OUTER JOIN T_GENDER_GEN ON T_GENDER_GEN.GEN_ID = T_CONTACT_CON.GEN_ID
              LEFT OUTER JOIN T_UPLOAD_UPL UPL ON UPL.UPL_ID = DQO.logo_id
              WHERE DQO.DQO_ID = ?
                AND DQO.USR_ID = USR.USR_ID
                AND USR.organization_id = ?
                AND USR.USR_ID = user_medical.user_id
                AND DQO.CON_ID = T_CONTACT_CON.CON_ID
          `,
          [no_devis, user.org],
        );

        if (!row?.length)
          throw new CBadRequestException("Ce devis n'existe pas ... ");
        const dentalQuotations = row?.[0];
        const couleur = dentalQuotations?.couleur ?? 'blue';
        const schemas = dentalQuotations?.schemas ?? 'none';
        currentUser.userPreferenceQuotation.displayOdontogram = schemas;
        currentUser.userPreferenceQuotation.color = couleur;
        titreDevisHN = dentalQuotations?.titreDevisHN ?? titreDevisHN;
        const actes = await this.dataSource.query(`
          SELECT DQA.DQA_ID as id_devisHN_ligne,
                   DQA.DQA_TYPE as typeLigne,
                   DQA.DQA_LOCATION as dentsLigne, 
                   DQA.DQA_NAME as descriptionLigne, 
                   descriptive_text,
                   DQA.DQA_MATERIAL as materiau, 
                   DQA.DQA_NGAP_CODE as cotation, 
                   DQA.DQA_REFUNDABLE as remboursable,
                   100 as prixachat, 
                   DQA.DQA_AMOUNT as prixLigne, 
                   DQA.DQA_AMOUNT_SECU as tarif_secu, 
                   DQA.DQA_RSS as rss, 
                   DQA.DQA_ROC as roc,
                   DQA.DQA_SECU_AMOUNT as secuAmount,
                   DQA.DQA_SECU_REPAYMENT as secuRepayment,
                   DQA.DQA_MUTUAL_REPAYMENT_TYPE as mutualRepaymentType,
                   DQA.DQA_MUTUAL_REPAYMENT_RATE as mutualRepaymentRate,
                   DQA.DQA_MUTUAL_REPAYMENT as mutualRepayment,
                   DQA.DQA_MUTUAL_COMPLEMENT as mutualComplement,
                   DQA.DQA_PERSON_REPAYMENT as personRepayment,
                   DQA.DQA_PERSON_AMOUNT as personAmount,
                   estimated_month_treatment as estimatedMonthTreatment
               FROM T_DENTAL_QUOTATION_ACT_DQA DQA
               WHERE DQA.DQO_ID = ${no_devis}
               ORDER BY DQA.DQA_POS ASC, DQA.DQA_ID ASC
          `);

        for (const acte of actes) {
          if (!acte?.typeLigne) acte.typeLigne = 'operation';
        }

        res = {
          id_user: dentalQuotations?.id_user,
          id_pdt: dentalQuotations?.id_pdt,
          logoId: dentalQuotations?.logoId,
          logoFilename: dentalQuotations?.logoFilename,
          paymentScheduleId: dentalQuotations?.payment_schedule_id,
          reference: dentalQuotations?.reference,
          couleur,
          schemas,
          practitionerRpps: dentalQuotations?.practitionerRpps,
          userPreferenceQuotation: currentUser?.userPreferenceQuotation,
          titreDevisHN,
          date_acceptation:
            dentalQuotations?.date_acceptation === '00/00/0000'
              ? ''
              : dentalQuotations?.date_acceptation,
          identPrat: dentalQuotations?.ident_prat,
          adressePrat: dentalQuotations?.addr_prat,
          id_contact: dentalQuotations?.ident_pat,
          nom_prenom_patient: dentalQuotations?.nom_prenom_patient,
          date_de_naissance_patient:
            dentalQuotations?.date_de_naissance_patient === '00/00/0000'
              ? ''
              : dentalQuotations?.date_de_naissance_patient,
          date_devis:
            dentalQuotations?.date_devis == '00/00/0000'
              ? ''
              : dentalQuotations?.date_devis,
          duree_devis: dentalQuotations?.duree_devis,
          customerNumber: dentalQuotations?.customerNumber,
          INSEE: `${dentalQuotations?.INSEE}`.replace(
            new RegExp('/(w{1})(w{2})(w{2})(w{2})(w{3})(w{3})(w{2})/'),
            '$1 $2 $3 $4 $5 $6 $7',
          ),
          adresse_pat: dentalQuotations?.adresse_pat,
          tel: dentalQuotations?.tel,
          organisme: dentalQuotations?.organisme,
          contrat: dentalQuotations?.contrat,
          ref: dentalQuotations?.ref,
          dispo: dentalQuotations?.dispo,
          dispo_desc: dentalQuotations?.dispo_desc,
          infosCompl: dentalQuotations?.description,
          quotationAmount: dentalQuotations?.amount,
          quotationPersonRepayment: dentalQuotations?.personRepayment,
          quotationPersonAmount: dentalQuotations?.personAmount,
          quotationSignaturePatient:
            dentalQuotations?.quotationSignaturePatient,
          quotationSignaturePraticien: dentalQuotations?.signaturePraticien,
          patientLastname: dentalQuotations?.patient_lastname,
          patientFirstname: dentalQuotations?.patient_firstname,
          patientInsee: dentalQuotations?.patient_insee,
          patientCivilityName: dentalQuotations?.patient_civility_name,
          patientCivilityLongName: dentalQuotations?.patient_civility_long_name,
          userType: currentUser?.type,
          actes,
        };
      } catch (error) {
        throw new CBadRequestException(error);
      }
    }

    try {
      let id_facture = 0;
      let noFacture = '';
      const contactEntity = await this.patientRepository.findOne({
        where: { id: res?.id_contact },
      });
      let socialSecurityReimbursementRate =
        contactEntity?.socialSecurityReimbursementRate;
      if (socialSecurityReimbursementRate === null) {
        socialSecurityReimbursementRate =
          currentUser?.socialSecurityReimbursementRate;
      }

      const bils = await this.dataSource?.query(`
      SELECT BIL.BIL_ID as id_facture,
      BIL.BIL_NBR as noFacture
      FROM T_BILL_BIL BIL
      WHERE BIL.DQO_ID = ${no_devis ?? 0}
      AND BIL.BIL_DELETE = 0
      `);

      if (bils?.length) {
        id_facture = bils?.[0]?.id_facture;
        noFacture = bils?.[0]?.noFacture;
      }
      res.id_facture = id_facture;
      res.noFacture = noFacture;

      let identPat = res?.nom_prenom_patient;
      if (res?.INSEE && res?.INSEE !== 'null') {
        identPat += `\n${res?.INSEE}`;
      }
      if (res?.date_de_naissance_patient) {
        identPat += `\n${res?.date_de_naissance_patient}`;
      }
      if (res?.adresse_pat) {
        identPat += `\n${res?.adresse_pat}`;
      }
      res.identPat = identPat;

      const max_long_descriptionLigne = pdf ? 36 : 65;
      const max_long_dentsLigne = pdf ? 7 : 8;
      const details = [];
      let total_prixvente = 0;
      let total_prestation = 0;
      let total_charges = 0;
      let total_prixLigne = 0;
      let total_rss = 0;
      let total_nrss = 0;
      const total_roc = '';

      for (const ar_acte of res?.actes ?? []) {
        if (pdf) {
          const ar_dents = `${ar_acte?.dentsLigne ?? ''}`?.split('9');
          ar_acte.dentsLigne = ar_dents?.join('\n');
        }
        ar_acte.nouveau = true;
        ar_acte.prixvente =
          Math.round((Number(ar_acte?.prixachat ?? 0) / (1 - txch)) * 100) /
          100;
        ar_acte.prestation =
          Math.round(
            Number(ar_acte?.prixLigne ?? 0) / (1 - txch) -
              Number(ar_acte?.prixachat ?? 0) * 100,
          ) / 100;
        ar_acte.charges =
          Math.round(
            Number(ar_acte?.prixLigne ?? 0) / (1 - txch) -
              Number(ar_acte?.prixachat ?? 0) * 100,
          ) / 100;
        ar_acte.prixLigne =
          Number(ar_acte?.prixvente ?? 0) -
          Number(ar_acte?.prestation ?? 0) -
          Number(ar_acte?.charges ?? 0);
        ar_acte.nrss = ar_acte.prixLigne - Number(ar_acte?.rss ?? 0);

        if (Math.abs(ar_acte.nrss) < 0.01) ar_acte.nrss = 0;
        ar_acte.roc = '';

        total_prixvente += Number(ar_acte.prixvente ?? 0);
        total_prestation += Number(ar_acte.prestation ?? 0);
        total_charges += Number(ar_acte.charges ?? 0);
        total_prixLigne += ar_acte.prixLigne;
        total_rss += Number(ar_acte.rss ?? 0);
        total_nrss += ar_acte.nrss;
        details.push(ar_acte);
      }

      const nb_lignes = 0;
      const nb_max_lignes_page = 24;
      const nb_max_lignes_page_annexe = 45;

      /**
       * if (isset($pdf)) {... todo ...} svg
       */
      if (res?.schemas != 'none') {
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
        if (res.schemas === 'three') {
          const init = await this.odotogramService?.show({
            name: 'adult',
            status: 'initial',
            conId: contactEntity?.id,
          });
          res.schemaInitial = setImagePath(init);
        }
        res.schemaActuel = setImagePath(
          await this.odotogramService?.show({
            name: 'adult',
            status: 'current',
            conId: contactEntity?.id,
          }),
        );
        res.schemaDevis = setImagePath(
          await this.odotogramService?.show({
            name: 'adult',
            status: 'planned',
            conId: contactEntity?.id,
          }),
        );
      }
      total_rss =
        Math.round((total_rss / socialSecurityReimbursementRate) * 100) / 100;
      const date_signature = dayjs().format('DD/MM/YYYY');

      res = {
        ...res,
        actes: details,
        max_long_descriptionLigne,
        max_long_dentsLigne,
        total_prixvente,
        total_charges,
        total_nrss,
        total_prestation,
        total_prixLigne,
        total_roc,
        total_rss,
        nb_lignes,
        nb_max_lignes_page,
        nb_max_lignes_page_annexe,
        date_signature,
      };
    } catch (error) {
      throw new CBadRequestException(error);
    }

    return res;
  }

  async generatePDF(
    user: UserIdentity,
    { no_pdt, duplicate, id, print }: DevisHNPdfDto,
  ) {
    const no_devis = checkId(id);
    try {
      const initital = await this.getInitChamps(user, { no_pdt, no_devis });
      const quote = await this.dentalQuotationRepository.findOne({
        where: { id: checkId(no_devis) || 0 },
        relations: {
          attachments: true,
        },
      });
      let color = '#FFFFFF';
      if (initital?.couleur === 'blue') color = '#DDDDFF';
      else if (initital?.couleur === 'grey') color = '#EEEEEE';

      const prestations = initital?.actes?.map((acte) => {
        const operation = acte?.typeLigne === 'operation';
        const ligneSeparation = acte?.typeLigne === 'ligneSeparation';
        const ligneBlanche = acte?.typeLigne === 'ligneBlanche';
        return {
          ...acte,
          operation,
          ligneSeparation,
          ligneBlanche,
        };
      });

      let imgRppsNumber = undefined;
      if (initital?.practitionerRpps) {
        imgRppsNumber = await generateBarcode({
          text: initital?.practitionerRpps,
          scaleX: 4,
          scaleY: 1,
        });
      }
      initital?.identPat;
      const dataTemp = {
        color,
        duplicata: duplicate,
        label: initital?.titreDevisHN,
        date: initital?.date_devis,
        duration: initital?.duree_devis,
        reference: initital?.reference,
        amount: initital?.quotationAmount,
        amount_repaid: initital?.quotationPersonRepayment,
        description: initital?.infosCompl,
        doctor: {
          imgRppsNumber,
          rpps: initital?.practitionerRpps,
          details: initital?.identPrat,
          address_details: initital?.adressePrat,
          signature: initital?.quotationSignaturePraticien,
        },
        patient: {
          number: `${initital?.customerNumber ?? 0}`?.padStart(6, '0'),
          lastname: initital?.patientLastname,
          firstname: initital?.patientFirstname,
          insee: initital?.patientInsee,
          details: initital?.identPat,
          signature: initital?.quotationSignaturePatient,
          civility: {
            long_name: initital?.patientCivilityLongName,
          },
        },
        prestations,
        odontogram: {
          initial: initital?.schemaInitial,
          current: initital?.schemaActuel,
          planned: initital?.schemaDevis,
        },
        src: '',
        width: 0,
        height: 0,
        paymentSchedule: undefined,
      };

      const options = {
        format: 'A4',
        displayHeaderFooter: true,
        headerTemplate: `<div></div>`,
        footerTemplate: `<div></div>`,
        margin: {
          left: '5mm',
          top: '5mm',
          right: '5mm',
          bottom: '5mm',
        },
        landscape: false,
      };

      const files = [];
      const basePath = path.join(
        process.cwd(),
        'templates/pdf/devisHN',
        'base.hbs',
      );

      files.push({ path: basePath, data: dataTemp });
      if (!print) {
        const filePath = path.join(
          process.cwd(),
          'templates/pdf/devisHN',
          'devis_hn_standand.hbs',
        );

        files.push({ path: filePath, data: dataTemp });
      }

      if (initital?.logoFilename && fs.existsSync(initital?.logoFilename)) {
        const imageBuffer = fs.readFileSync(initital?.logoFilename);
        const base64Image = imageBuffer.toString('base64');
        dataTemp.src = base64Image;
        dataTemp.width = 350;
        dataTemp.height = 100;
      }

      if (initital?.paymentScheduleId) {
        try {
          const mail =
            await this.dataMailService.findOnePaymentScheduleTemplateByDoctor(
              initital?.id_user,
            );
          const mailContext = await this.templateMailService.contextMail(
            {
              patient_id: initital?.id_contact,
              payment_schedule_id: initital?.paymentScheduleId,
            },
            initital?.id_user,
          );
          const mailConverted = await this.previewMailService.transform(
            mail,
            mailContext,
          );
          const pdf = await this.pdfMailService.pdf(mailConverted, {
            preview: true,
          });
          files.push({ type: 'string', data: pdf });
        } catch (err) {
          const paymentScheduleContext =
            await this.paymentScheduleService?.find(
              initital?.paymentScheduleId,
              user?.org,
            );
          dataTemp.paymentSchedule = paymentScheduleContext;
          const filePath = path.join(
            process.cwd(),
            'templates/pdf/devisHN',
            'payment_schedule.hbs',
          );

          files.push({ path: filePath, data: dataTemp });
        }
      }

      if (initital.schemas !== 'none') {
        const filePathSchemas = path.join(
          process.cwd(),
          'templates/pdf/devisHN',
          'odontogram.hbs',
        );
        files.push({ path: filePathSchemas, data: dataTemp });
      }

      if (quote?.attachments?.length) {
        for (const attachment of quote?.attachments) {
          const mail = await this.dataMailService.find(attachment?.id);
          if (mail?.patient) {
            const content = await this.pdfMailService.pdf(mail, {
              preview: true,
            });
            files.push({ type: 'string', data: content });
          }
        }
      }

      return await customCreatePdf({
        files,
        options: options,
        helpers: {},
      });
    } catch (err) {
      console.log('-----data-----', err);
      throw new CBadRequestException(err);
    }
  }
}
