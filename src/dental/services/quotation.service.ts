import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MedicalHeaderEntity } from 'src/entities/medical-header.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { UserEntity } from 'src/entities/user.entity';
import { QuotationDevisRequestAjaxDto } from '../dto/devis_request_ajax.dto';
import {
  UserPreferenceQuotationDisplayAnnexeType,
  UserPreferenceQuotationDisplayOdontogramType,
  UserPreferenceQuotationEntity,
} from 'src/entities/user-preference-quotation.entity';
import {
  PreferenceQuotationDto,
  QuotationInitChampsDto,
} from '../dto/quotation.dto';
import { ErrorCode } from 'src/constants/error';
import {
  QuotationInitActeRes,
  QuotationInitChampsRes,
} from '../res/quotation.res';
import { OrganizationEntity } from 'src/entities/organization.entity';
import {
  checkBoolean,
  checkId,
  checkNumber,
  toFixed,
} from 'src/common/util/number';
import { PlanPlfEntity } from 'src/entities/plan-plf.entity';
import { EventEntity } from 'src/entities/event.entity';
import { br2nl, generateFullName, validateEmail } from 'src/common/util/string';
import * as dayjs from 'dayjs';
import { checkDay, customDayOfYear } from 'src/common/util/day';
import { DentalQuotationEntity } from 'src/entities/dental-quotation.entity';
import { inseeFormatter } from 'src/common/formatter';
import { PaymentScheduleService } from 'src/payment-schedule/services/payment-schedule.service';
import {
  DentalQuotationActEntity,
  EnumDentalQuotationActRefundable,
} from 'src/entities/dental-quotation-act.entity';
import { LibraryActQuantityEntity } from 'src/entities/library-act-quantity.entity';
import { LibraryActEntity } from 'src/entities/library-act.entity';
import { StringHelper } from 'src/common/util/string-helper';
import * as path from 'path';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import { MailTransportService } from 'src/mail/services/mailTransport.service';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';
import { SuccessResponse } from 'src/common/response/success.res';
import { CForbiddenRequestException } from 'src/common/exceptions/forbidden-request.exception';
import { PerCode } from 'src/constants/permissions';
import { PermissionService } from 'src/user/services/permission.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QuotationServices {
  constructor(
    @InjectRepository(MedicalHeaderEntity)
    private medicalHeaderRepository: Repository<MedicalHeaderEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(UserPreferenceQuotationEntity)
    private userPreferenceQuotationRepository: Repository<UserPreferenceQuotationEntity>,
    @InjectRepository(OrganizationEntity)
    private organizationRepository: Repository<OrganizationEntity>,
    @InjectRepository(PlanPlfEntity)
    private planPlfRepository: Repository<PlanPlfEntity>,
    @InjectRepository(EventEntity)
    private eventRepo: Repository<EventEntity>,
    @InjectRepository(LibraryActQuantityEntity)
    private libraryActQuantityRepo: Repository<LibraryActQuantityEntity>,
    @InjectRepository(LibraryActEntity)
    private libraryActRepo: Repository<LibraryActEntity>,
    @InjectRepository(DentalQuotationEntity)
    private dentalQuotationRepository: Repository<DentalQuotationEntity>,
    @InjectRepository(ContactNoteEntity)
    private contactNoteRepo: Repository<ContactNoteEntity>,
    private paymentScheduleService: PaymentScheduleService,
    private dataSource: DataSource,
    private mailTransportService: MailTransportService,
    private permissionService: PermissionService,
    private configService: ConfigService,
  ) {}

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
      // const filename = `Devis${dayjs(data.date).format('YYYYMMDD')}.pdf`;
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
        // attachments: [
        //   {
        //     filename: filename,
        //     content: await this.generatePdf({ id }, identity),
        //   },
        // ],
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
        userId: data.userId,
        date: dayjs().format('YYYY-MM-DD'),
        message: `Envoi par email du devis du ${date} de ${data.user.lastname} ${data.user.firstname}`,
      });

      return {
        success: true,
      };
    } catch (error) {
      throw new CBadRequestException(ErrorCode.CANNOT_SEND_MAIL);
    }
  }

  // dental/quotation/quotation_requetes_ajax.php (line 7 - 270)
  async quotationDevisRequestsAjax(
    req: QuotationDevisRequestAjaxDto,
    identity: UserIdentity,
  ) {
    const {
      operation,
      ident_prat,
      id_pdt,
      ident_pat,
      schemes,
      details,
      nom_prenom_patient,
      duree_devis,
      adresse_pat,
      tel,
      organisme,
      contrat,
      ref,
      dispo,
      dispo_desc,
      description,
      placeOfManufacture,
      placeOfManufactureLabel,
      withSubcontracting,
      placeOfSubcontracting,
      placeOfSubcontractingLabel,
      displayNotice,
      signaturePatient,
      signaturePraticien,
      date_devis,
      date_de_naissance_patient,
      materiau,
      id_devis_ligne,
      quotationPlaceOfManufacture,
      quotationPlaceOfManufactureLabel,
      // quotationWithSubcontracting,
      // quotationPlaceOfSubcontracting,
      // quotationPlaceOfSubcontractingLabel,
      date_acceptation,
    } = req;
    const idUser = identity?.id;
    const birthday = date_de_naissance_patient;

    let { insee, id_devis } = req;
    id_devis = id_devis ?? 0;
    if (operation === 'enregistrer') {
      try {
        let acceptedAt = date_acceptation;
        if (!acceptedAt) {
          acceptedAt = null;
        } else {
          await this.dataSource.query(
            `
          UPDATE T_PLAN_PLF
          JOIN T_DENTAL_QUOTATION_DQO
          SET PLF_ACCEPTED_ON = ?
          WHERE T_PLAN_PLF.PLF_ACCEPTED_ON IS NULL
            AND T_PLAN_PLF.PLF_ID = T_DENTAL_QUOTATION_DQO.PLF_ID
            AND T_DENTAL_QUOTATION_DQO.DQO_ID = ?
        `,
            [acceptedAt, id_devis],
          );
        }
        if (insee !== null) {
          insee = insee.replace(/\s/g, '');
        }
        const inputParameters = [
          idUser,
          id_pdt,
          ident_pat,
          schemes,
          details,
          acceptedAt,
          ident_prat,
          nom_prenom_patient,
          birthday,
          insee,
          duree_devis,
          adresse_pat,
          tel,
          organisme,
          contrat,
          ref,
          dispo,
          dispo_desc,
          description,
          date_devis,
          placeOfManufacture,
          placeOfManufactureLabel,
          withSubcontracting,
          placeOfSubcontracting,
          placeOfSubcontractingLabel,
          displayNotice,
          signaturePatient ?? null,
          signaturePraticien ?? null,
        ];

        await this.dataSource.query(
          `
          UPDATE T_DENTAL_QUOTATION_DQO DQO
          SET DQO.USR_ID = ?,
            DQO.PLF_ID = ?,
            DQO.CON_ID = ?,
            DQO.DQO_SCHEMES = ?,
            DQO.DQO_DETAILS = ?,
            DQO.DQO_DATE_ACCEPT = ?,
            DQO.DQO_IDENT_PRAT = ?,
            DQO.DQO_IDENT_CONTACT = ?,
            DQO.DQO_BIRTHDAY = ?,
            DQO.DQO_INSEE = ?,
            DQO.DQO_DURATION = ?,
            DQO.DQO_ADDRESS = ?,
            DQO.DQO_TEL = ?,
            DQO.DQO_ORGANISM = ?,
            DQO.DQO_CONTRACT = ?,
            DQO.DQO_REF = ?,
            DQO.DQO_DISPO = ?,
            DQO.DQO_DISPO_MSG = ?,
            DQO.DQO_MSG = ?,
            DQO.DQO_DATE = ?,
            DQO.DQO_PLACE_OF_MANUFACTURE = ?,
            DQO.DQO_PLACE_OF_MANUFACTURE_LABEL = ?,
            DQO.DQO_WITH_SUBCONTRACTING = ?,
            DQO.DQO_PLACE_OF_SUBCONTRACTING = ?,
            DQO.DQO_PLACE_OF_SUBCONTRACTING_LABEL = ?,
            DQO.DQO_DISPLAY_NOTICE = ?,
            DQO.DQO_SIGNATURE_PATIENT = ?,
            DQO.DQO_SIGNATURE_PRATICIEN = ?
          WHERE DQO_ID = ?
        `,
          inputParameters,
        );

        let medicalHeader = await this.medicalHeaderRepository.findOne({
          where: { userId: identity?.id },
        });
        if (!(medicalHeader instanceof MedicalHeaderEntity)) {
          const user = await this.userRepository.findOne({
            where: { id: identity?.id },
          });
          medicalHeader = new MedicalHeaderEntity();
          medicalHeader.user = user;
        }
        medicalHeader.identPratQuot = ident_prat;
        await this.medicalHeaderRepository.save(medicalHeader);

        return 'Devis enregistré correctement';
      } catch (err) {
        throw new CBadRequestException(
          `Erreur -3 : Problème durant la sauvegarde du devis ... ${err?.message}`,
        );
      }
    } else if (operation === 'enregistrerActe') {
      try {
        const dentalQuotationActId = id_devis_ligne;
        const dentalQuotationActMateriaux = materiau;
        await this.dataSource.query(
          `UPDATE T_DENTAL_QUOTATION_ACT_DQA
          SET DQA_MATERIAL = ?
          WHERE DQA_ID = ?`,
          [dentalQuotationActId, dentalQuotationActMateriaux],
        );
        return `Acte de devis enregistré correctement`;
      } catch (err) {
        throw new CBadRequestException(
          `Erreur -4 : Problème durant la sauvegarde d'un acte du devis ... ${err?.message}`,
        );
      }
    } else if (operation === 'checkNoFacture') {
      try {
        const data = await this.dataSource.query(`
          SELECT 
            BIL.BIL_ID as id_facture,
            BIL.BIL_NBR as noFacture 
          FROM T_BILL_BIL BIL 
          WHERE BIL.BIL_ID = " . ${id_devis}       
        `);

        return JSON.stringify(data);
      } catch (err) {
        throw new CBadRequestException(
          `Erreur -5 : Problème durant la récupération du numéro de facture ... ${err?.message}`,
        );
      }
    } else if (operation === 'saveUserPreferenceQuotation') {
      const queryBuilder = this.dataSource
        .getRepository(UserEntity)
        .createQueryBuilder('usr');
      const user = await queryBuilder
        .leftJoin('usr.group', 'group')
        .leftJoin('usr.userPreferenceQuotation', 'upq')
        .addSelect('uqp')
        .where('usr.id = :id', { id: idUser })
        .andWhere('usr.group.id = :groupId', { groupId: identity?.org })
        .getOne();
      const quotation = user.userPreferenceQuotation;
      if (!(quotation instanceof UserPreferenceQuotationEntity)) {
        await this.userPreferenceQuotationRepository.save({ user: user });
      }
      quotation.placeOfManufacture = quotationPlaceOfManufacture;
      quotation.placeOfManufactureLabel = quotationPlaceOfManufactureLabel;
      quotation.withSubcontracting = withSubcontracting;
      quotation.placeOfSubcontracting = placeOfSubcontracting;
      quotation.placeOfSubcontractingLabel = placeOfSubcontractingLabel;
      await this.userPreferenceQuotationRepository.save(quotation);
    }

    return `Erreur -2`;
  }

  // ecoophp/dental/quotation/devis_init_champs.php
  async initChamps(req: QuotationInitChampsDto, identity: UserIdentity) {
    let result = {
      id_pdt: checkId(req?.id_pdt),
      id_devis: checkId(req?.id_devis),
      id_user: checkId(req?.id_user),
      txch: 0,
      tauxRemboursementSecu: 100,
      ids_events: '',
    } as QuotationInitChampsRes;
    try {
      const group = await this.organizationRepository.findOne({
        where: { id: identity.org },
        select: { ccamEnabled: true },
      });
      result.hasCcamEnabled = checkBoolean(group?.ccamEnabled);
      result.quotationMutualTitle = `
        <div>
          <div style="text-align: center;"><span style="font-size: 14pt;"><strong>ANNEXE AU DEVIS CONVENTION</strong></span></div>
          <div style="text-align: center;"><span style="font-size: 11pt;"><strong>pour traitements et actes bucco-dentaires pouvant faire l\'objet d\'une entente directe</strong></span></div>
          <div style="text-align: center;"><span style="font-size: 11pt;">Les soins &agrave; tarifs opposables ne sont pas compris dans ce devis</span></div>
          <div style="text-align: center;"><span style="font-size: 11pt;">Ce devis est la propri&eacute;t&eacute; du patient, sa communication &agrave; un tiers se fait sous sa seule reponsabilit&eacute;.</span></div>
        </div>
      `;
      if (result?.id_pdt) {
        result = await this.initChampsByIdPdt(req, result, identity);
      } else if (result?.id_devis) {
        result = await this.initChampsByNoDevis(req, result, identity);
      }
      result.max_long_libelle = !req?.pdf ? 36 : 44;
      result.max_long_localisation = 5;
      result.ar_details = [] as QuotationInitActeRes[];
      result.total_prixvente = 0;
      result.total_prestation = 0;
      result.total_charges = 0;
      result.total_honoraires = 0;
      result.total_secuAmount = 0;
      result.total_secuRepayment = 0;
      result.total_mutualRepayment = 0;
      result.total_mutualComplement = 0;
      result.total_personAmount = 0;
      result.total_remboursement = 0;
      result.total_charges_patient = 0;
      result.total_rss = 0;
      result.total_nrss = 0;
      result.total_roc = '';

      if (!result?.txch) {
        const query = `
          SELECT IF(IFNULL(USR_RATE_CHARGES, 0) >= 1, IFNULL(USR_RATE_CHARGES, 0) / 100, IFNULL(USR_RATE_CHARGES, 0)) as num
          FROM T_USER_USR
          WHERE USR_ID = ${result.id_user}
        `;
        const dataQ = await this.dataSource.query(query);
        if (dataQ.length) result.txch = dataQ[0].num;
      }

      for await (const ar_acte of result?.actes) {
        if (!ar_acte?.materiau?.length && ar_acte.library_act_id) {
          const libAct = await this.libraryActRepo.findOne({
            where: {
              id: ar_acte.library_act_id,
            },
          });
          ar_acte.materiau = libAct.materials;
        } else if (ar_acte.library_act_quantity_id) {
          const libActQuantity = await this.libraryActQuantityRepo.findOne({
            where: { id: ar_acte.library_act_quantity_id },
          });
          ar_acte.materiau = libActQuantity.materials;
        }

        const ar_dents = StringHelper.trunkLine(
          ar_acte?.localisation,
          result.max_long_localisation,
          ',',
        );
        const ar_libelle = StringHelper.trunkLine(
          ar_acte?.libelle,
          result.max_long_libelle,
        );

        (ar_acte.nouveau = true), (ar_acte.localisation = ar_dents[0]);
        ar_acte.libelle = ar_libelle[0];

        ar_acte.prixvente = toFixed(ar_acte.prixvente);
        ar_acte.prestation = toFixed(ar_acte.prestation);
        ar_acte.charges = toFixed(ar_acte.charges);
        ar_acte.honoraires = toFixed(ar_acte.honoraires);
        ar_acte.rss = !ar_acte.rss ? 0 : toFixed(ar_acte.rss);
        ar_acte.nrss = toFixed(ar_acte.nrss);

        ar_acte.prixvente = toFixed(ar_acte.prixachat / (1 - result.txch));
        ar_acte.prestation = toFixed(
          ar_acte.honoraires * (1 - result.txch) - ar_acte.prixachat,
          2,
        );
        ar_acte.charges = toFixed(
          ar_acte.honoraires - ar_acte.prestation - ar_acte.prixvente,
        );
        ar_acte.honoraires = toFixed(
          ar_acte.prixvente + ar_acte.prestation + ar_acte.charges,
        );

        if (result?.hasCcamEnabled) {
          ar_acte.rss = ar_acte.secuAmount;
        } else if (ar_acte.remboursable === 'oui') {
          ar_acte.rss = (ar_acte.rss * result.tauxRemboursementSecu) / 100;
        }

        ar_acte.roc = '';
        result.total_prixvente += checkNumber(ar_acte.prixvente);
        result.total_prestation += checkNumber(ar_acte.prestation);
        result.total_charges += checkNumber(ar_acte.charges);
        result.total_honoraires += checkNumber(ar_acte.honoraires);
        result.total_rss += checkNumber(ar_acte.rss);
        result.total_nrss += checkNumber(ar_acte.nrss);
        result.total_secuAmount += checkNumber(ar_acte.secuAmount);
        result.total_secuRepayment += checkNumber(ar_acte.secuRepayment);
        result.total_mutualRepayment += checkNumber(ar_acte.mutualRepayment);
        result.total_mutualComplement += checkNumber(ar_acte.mutualComplement);
        result.total_personAmount += checkNumber(ar_acte.personAmount);
        result.ar_details.push(ar_acte);
        const dentsLength = ar_dents.length;
        const libelleLength = ar_libelle.length;
        ar_dents.forEach((dent, i) => {
          result?.ar_details?.push({
            localisation: dent,
            libelle: libelleLength > i ? ar_libelle[i] : '',
            nouveau: false,
          });
        });

        for (let i = dentsLength; i < libelleLength; i++) {
          result?.ar_details?.push({
            libelle: ar_libelle[i] ? ar_libelle[i] : '',
            nouveau: false,
          });
        }
      }

      result.nb_lignes = 0;
      result.nb_max_lignes_page1 = 9;
      result.nb_max_lignes_pageN = 30;
      result.nb_lignes_annexe = 0;
      result.nb_max_lignes_annexe_page1 = 15;
      result.nb_max_lignes_annexe_pageN = 30;
      result.odontogramType = 'adult';

      result.total_honoraires = toFixed(result?.total_honoraires);
      result.total_prixvente = toFixed(result?.total_prixvente);
      result.total_prestation = toFixed(result?.total_prestation);
      result.total_charges = toFixed(result?.total_charges);
      result.total_rss = toFixed(result?.total_rss);
      result.total_nrss = toFixed(result?.total_nrss);

      result.total_secuAmount = toFixed(result?.total_secuAmount);
      result.total_secuRepayment = toFixed(result?.total_secuRepayment);
      result.total_mutualRepayment = toFixed(result?.total_mutualRepayment);
      result.total_mutualComplement = toFixed(result?.total_mutualComplement);
      result.total_personAmount = toFixed(result?.total_personAmount);

      result.total_roc = '';
      result.date_signature = dayjs().format('DD/MM/YYYY');

      delete result.actes;
      return result;
    } catch (error) {
      throw new CBadRequestException(ErrorCode.INVALID_PARAMETER);
    }
  }

  /**
   *  ecoophp/dental/quotation/devis_init_champs.php 60 -523
   * @param req QuotationInitChampsDto
   * @param result QuotationInitChampsRes
   * @param identity UserIdentity
   * @returns QuotationInitChampsRes
   */
  async initChampsByIdPdt(
    req: QuotationInitChampsDto,
    result: QuotationInitChampsRes,
    identity: UserIdentity,
  ): Promise<QuotationInitChampsRes> {
    try {
      // 2013-10-30 Sébastien BORDAT
      // Récupération de l'entité représentant le plan de traitement
      // en vérifiant qu'il appartient bien au groupe connecté
      const plan = await this.planPlfRepository
        .createQueryBuilder('plf')
        .leftJoinAndSelect('plf.events', 'plv')
        .leftJoinAndSelect('plv.event', 'evt')
        .leftJoinAndSelect('evt.contact', 'con')
        .where('plf.id = :id', { id: result?.id_pdt })
        .andWhere('con.group = :group', { group: identity?.org })
        .getOne();
      if (!plan) {
        throw new CBadRequestException(
          'You do not have the required permission to perform this operation',
        );
      } else {
        if (!plan.events.length) {
          throw new CBadRequestException(
            'You do not have the required permission to perform this operation',
          );
        }
      }

      plan.events.forEach((event) => {
        result.last_event_id = event?.evtId;
        result.ids_events += event?.evtId + ', ';
      });
      result.ids_events = result?.ids_events?.slice(0, -2);

      // Récupération des infos utilisateur et patient
      const event = await this.eventRepo.findOne({
        where: {
          id: result?.last_event_id || 0,
        },
      });
      if (!event) {
        throw new CBadRequestException(
          'Probl&egrave;me durant le rapatriement des informations du rendez-vous ...',
        );
      }
      result.ident_pat = event?.conId;
      result.id_contact = result?.ident_pat;

      /*
       * 2012-11-28 11:01 sébastien
       * - vérification si le rendez-vous possède un utilisateur sinon
       * on récupère l'identifiant de l'utilisateur passé en paramètre
       */
      if (!result?.id_user) {
        result.id_user = event?.usrId;
        if (!result?.id_user) {
          throw new CBadRequestException(
            'Un identifiant de praticien est requis',
          );
        }
      }
      const user = await this.userRepository.findOne({
        where: { id: result?.id_user },
        relations: {
          type: true,
          address: true,
        },
      });
      if (!user || !checkBoolean(user?.type?.professional)) {
        throw new CBadRequestException(
          "Vous n'avez pas assez de privilège pour accéder aux factures",
        );
      }
      delete user.password;
      delete user.passwordAccounting;
      delete user.passwordHash;
      result.user = user;

      // Récupération de l'entête de l'utilisateur
      result.ident_prat = generateFullName(user?.firstname, user?.lastname);
      if (user?.address?.id) {
        const addr = user?.address;
        result.adressePrat = `${addr.street} \n${addr.zipCode} ${addr.city} \n\n`;
      }
      result.userNumeroFacturant = user.numeroFacturant;
      result.userRateCharges = checkNumber(user.rateCharges);
      result.userSignature = user.signature;

      if (result?.userNumeroFacturant) {
        result.adressePrat += `N° ADELI : ${result?.userNumeroFacturant}`;
      }
      if (result?.userRateCharges) {
        result.txch =
          result?.userRateCharges >= 1
            ? result.userRateCharges / 100
            : result?.userRateCharges;
      }

      // Récupération de l'entête.
      const medicalHeader = await this.medicalHeaderRepository.findOne({
        where: {
          userId: result.id_user,
        },
      });
      if (medicalHeader) {
        result.medicalHeaderIdentPratQuot = medicalHeader?.identPratQuot;
        if (result?.medicalHeaderIdentPratQuot) {
          result.ident_prat = br2nl(result?.medicalHeaderIdentPratQuot);
          result.adressePrat = '';
        } else {
          result.ident_prat = medicalHeader?.identPrat
            ? br2nl(medicalHeader?.identPrat)
            : result?.ident_prat;
          result.adressePrat = medicalHeader?.address
            ? br2nl(medicalHeader?.address)
            : result?.adressePrat;
        }
      }
      const pattern = /("Entrepreneur Individuel"|"EI")/;
      const match = result?.ident_prat?.match(pattern);
      if (user?.freelance && !match) {
        const pattern = new RegExp(
          `(${generateFullName(user.firstname, user.lastname)})`,
          'g',
        );
        const replacement = '$1 "EI"';
        result.ident_prat = result.ident_prat.replace(pattern, replacement);
      } else if (!user?.freelance && match) {
        result.ident_prat = result.ident_prat.replace(
          /("Entrepreneur Individuel"|"EI")/g,
          '',
        );
      }

      const userPreferenceQuotation =
        await this.userPreferenceQuotationRepository.findOne({
          where: { usrId: result.id_user },
        });
      result.periodOfValidity = userPreferenceQuotation.periodOfValidity;
      result.quotationPlaceOfManufacture =
        userPreferenceQuotation.placeOfManufacture;
      result.quotationPlaceOfManufactureLabel =
        userPreferenceQuotation.placeOfManufactureLabel;
      result.quotationWithSubcontracting =
        userPreferenceQuotation.withSubcontracting;
      result.quotationPlaceOfSubcontracting =
        userPreferenceQuotation.placeOfSubcontracting;
      result.quotationPlaceOfSubcontractingLabel =
        userPreferenceQuotation.placeOfManufactureLabel;
      result.userPreferenceQuotationDisplayOdontogram =
        userPreferenceQuotation.displayOdontogram;
      result.userPreferenceQuotationDisplayDetails =
        userPreferenceQuotation.displayAnnexe;
      result.userPreferenceQuotationDisplayNotice =
        userPreferenceQuotation.displayNotice;

      if (result?.adressePrat) {
        result.ident_prat += '\n' + result?.adressePrat;
      }
      // Récupération de la dernière référence.
      const today = dayjs();
      const year = today.year();
      const dayOfYear = customDayOfYear(today);
      const randomQuery = await this.dataSource
        .createQueryBuilder()
        .select('IFNULL(SUBSTRING(MAX(reference), -5), 0) reference')
        .from(DentalQuotationEntity, 'DQO')
        .where('USR_ID = :user_id', { user_id: user?.id })
        .andWhere("reference LIKE CONCAT(:year, :dayOfYear, '%')", {
          year,
          dayOfYear,
        })
        .getRawOne();
      let random = 1;
      if (randomQuery?.reference) {
        random = Number(randomQuery?.reference) + 1;
      }

      random = +Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, '0');

      // Combine the components to form the reference string
      result.reference = `${year}${dayOfYear}-${random}`;
      const patients = await this.dataSource.query(`
      SELECT CONCAT(CON.CON_LASTNAME, ' ', CON.CON_FIRSTNAME) as nom_prenom_patient,
              CONCAT(CON.CON_INSEE,' ',CON.CON_INSEE_KEY) as INSEE,
              CON.CON_LASTNAME AS patient_lastname,
              CON.CON_FIRSTNAME AS patient_firstname,
              T_GENDER_GEN.GEN_NAME AS patient_civility_name,
              CON.CON_BIRTHDAY as birthday,
              CON.ADR_ID,
              CON.CON_MAIL as email,
              CONCAT(ADR.ADR_STREET, '\n', ADR.ADR_ZIP_CODE, ' ', ADR.ADR_CITY) as address,
              (
                  SELECT CONCAT(PHO.PHO_NBR, ' (', PTY.PTY_NAME, ')') 
                  FROM T_CONTACT_PHONE_COP COP, T_PHONE_PHO PHO, T_PHONE_TYPE_PTY PTY
                  WHERE COP.CON_ID = CON.CON_ID
                    AND COP.PHO_ID = PHO.PHO_ID
                    AND PHO.PTY_ID = PTY.PTY_ID
                  ORDER BY PTY.PTY_ID
                  LIMIT 1
              ) as phone
      FROM T_CONTACT_CON CON
      LEFT OUTER JOIN T_ADDRESS_ADR ADR ON ADR.ADR_ID = CON.ADR_ID
      LEFT OUTER JOIN T_GENDER_GEN ON T_GENDER_GEN.GEN_ID = CON.GEN_ID
      WHERE CON.CON_ID = ${result?.ident_pat}`);
      if (!patients?.length) {
        throw new CBadRequestException(
          'Probl&egrave;me durant le rapatriement des nom et pr&eacute;nom du patient ... ',
        );
      }
      const patient = patients[0];
      result.patientLastname = patient.patient_lastname;
      result.patientFirstname = patient.patient_firstname;
      result.patientCivilityName = patient.patient_civility_name;
      result.nom_prenom_patient = patient.nom_prenom_patient;
      result.INSEE = inseeFormatter(patient?.INSEE);
      result.date_de_naissance_patient = patient.birthday;
      result.tel = patient.phone;
      result.email = patient.email;
      result.adresse_pat = patient.address;

      result.quotationAmount = plan.amount;
      result.quotationPersonRepayment = plan.personRepayment;
      result.quotationPersonAmount = plan.personAmount;

      const actes = [] as QuotationInitActeRes[];
      const events = await this.dataSource.query(`
      SELECT
      ETK.ETK_NAME as 'libelle',
      library_act_id,
      library_act_quantity_id,
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
          0 as 'materiau',
          0 as 'roc',
          ngap_key.name AS ngap_key_name,
          ngap_key.unit_price AS ngap_key_unit_price
      FROM T_EVENT_TASK_ETK ETK
      LEFT OUTER JOIN T_DENTAL_EVENT_TASK_DET DET ON DET.ETK_ID = ETK.ETK_ID
      LEFT OUTER JOIN ngap_key ON ngap_key.id = DET.ngap_key_id
      WHERE ETK.EVT_ID IN (${result?.ids_events})
      ORDER BY ETK.EVT_ID, ETK.ETK_POS
      `);

      events.forEach((event) => {
        const acte = {} as QuotationInitActeRes;
        acte.cotation = 'NPC';
        acte.tarif_secu = 0;
        acte.rss = 0;
        if (event?.type === 'CCAM') {
          acte.cotation = event?.ccamCode;
          acte.tarif_secu = event?.secuAmount;
          acte.rss = event?.secuRepayment;
        } else if (event?.type === 'NGAP') {
          acte.ngapKeyName = event?.ngap_key_name;
          acte.ngapKeyUnitPrice = checkNumber(event?.ngap_key_unit_price);
          switch (acte.ngapKeyName) {
            case 'CR MC':
            case 'CV MC':
              acte.ngapKeyName = 'C';
              break;
            case 'DR MC':
            case 'DV MC':
              acte.ngapKeyName = 'D';
              break;
            case 'ZR MC':
            case 'ZV MC':
              acte.ngapKeyName = 'Z';
              break;
            default:
              break;
          }
          acte.cotation = `${acte.ngapKeyName} ${
            event?.coef ? event?.coef : ''
          }`.trim();
          acte.tarif_secu = acte.ngapKeyUnitPrice * checkNumber(event?.coef);
          if (event?.remboursable === 'oui') {
            acte.rss = acte.ngapKeyUnitPrice * checkNumber(event?.coef);
          }
        }
        actes.push({
          ...event,
          ...acte,
        });
      });
      result.date_devis = checkDay(plan?.createdAt);
      result.duree_devis = '';
      result.organisme = ''; //"Nom de l'organisme complémentaire";
      result.contrat = ''; //"N° de contrat ou d'adhérent";
      result.ref = ''; //"Référence dossier";
      result.dispo = false;
      result.dispo_desc = '';
      result.description = '';
      result.date_acceptation = '';

      // Gestion de l'échéancier
      const paymentScheduleStatement = await this.planPlfRepository.findOne({
        where: {
          id: result.id_pdt,
        },
        select: { paymentScheduleId: true },
      });
      let paymentSchedule;
      let paymentScheduleId: number | null = null;
      if (paymentScheduleStatement) {
        paymentScheduleId = paymentScheduleStatement?.paymentScheduleId;
        paymentSchedule = await this.paymentScheduleService.duplicate(
          paymentScheduleId,
          identity,
        );
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
        const q1 = `
        DELETE BLN, BIL
        FROM T_DENTAL_QUOTATION_DQO DQO,
             T_BILL_BIL BIL
        LEFT OUTER JOIN T_BILL_LINE_BLN BLN ON BLN.BIL_ID = BIL.BIL_ID
        WHERE DQO.PLF_ID = ?
          AND DQO.DQO_ID = BIL.DQO_ID
        `;
        await queryRunner.query(q1, [result?.id_pdt]);
        await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
        const planAmount = plan?.amount;
        const planPersonRepayment = plan?.personRepayment;
        const planPersonAmount = plan?.personAmount;

        const q2 = `
        REPLACE INTO T_DENTAL_QUOTATION_DQO (
          USR_ID, 
          PLF_ID,
          payment_schedule_id,
          reference,
          DQO_SCHEMES, 
          DQO_DETAILS, 
          DQO_IDENT_PRAT, 
          CON_ID, 
          DQO_IDENT_CONTACT, 
          DQO_DATE, 
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const query2Result = await queryRunner.query(q2, [
          result.id_user,
          result.id_pdt,
          paymentScheduleId,
          result.reference,
          result?.userPreferenceQuotationDisplayOdontogram,
          result?.userPreferenceQuotationDisplayDetails,
          result?.ident_prat,
          result.ident_pat,
          result?.nom_prenom_patient,
          result?.date_devis,
          result?.adresse_pat,
          result?.tel,
          result?.INSEE,
          result?.date_de_naissance_patient,
          planAmount,
          planPersonRepayment,
          planPersonAmount,
          result?.periodOfValidity,
          result?.quotationPlaceOfManufacture,
          result?.quotationPlaceOfManufactureLabel,
          result?.quotationWithSubcontracting,
          result?.quotationPlaceOfSubcontracting,
          result?.quotationPlaceOfSubcontractingLabel,
          result?.userPreferenceQuotationDisplayNotice,
        ]);
        result.id_devis = query2Result?.insertId;
        const acts: DentalQuotationActEntity[] = actes.map((acte) => {
          return {
            DQOId: result.id_devis,
            libraryActId: acte?.library_act_id,
            libraryActQuantityId: acte?.library_act_quantity_id,
            location: acte?.localisation,
            name: acte?.libelle,
            material: acte?.materiau,
            ngapCode: acte?.cotation,
            purchasePrice: checkNumber(acte?.prixachat),
            refundable: acte?.remboursable as EnumDentalQuotationActRefundable,
            amount: checkNumber(acte?.honoraires),
            amountSecu: checkNumber(acte?.tarif_secu),
            rss: checkNumber(acte?.rss),
            roc: checkNumber(acte?.roc),
            secuAmount: checkNumber(acte?.secuAmount),
            secuRepayment: checkNumber(acte?.secuRepayment),
            mutualRepaymentType: checkNumber(acte?.mutualRepaymentType),
            mutualRepaymentRate: checkNumber(acte?.mutualRepaymentRate),
            mutualRepayment: checkNumber(acte?.mutualRepayment),
            mutualComplement: checkNumber(acte?.mutualComplement),
            personRepayment: checkNumber(acte?.personRepayment),
            personAmount: checkNumber(acte?.personAmount),
          };
        });
        await queryRunner.manager.save(DentalQuotationActEntity, acts);
        await queryRunner.commitTransaction();
      } catch (err) {
        await queryRunner.rollbackTransaction();
      } finally {
        await queryRunner.release();
      }

      return result;
    } catch (error) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }
  }

  /**
   *  ecoophp/dental/quotation/devis_init_champs.php 523 - 673
   * @param req QuotationInitChampsDto
   * @param result QuotationInitChampsRes
   * @param identity UserIdentity
   * @returns QuotationInitChampsRes
   */
  async initChampsByNoDevis(
    req: QuotationInitChampsDto,
    result: QuotationInitChampsRes,
    identity: UserIdentity,
  ): Promise<QuotationInitChampsRes> {
    try {
      const query = `
      SELECT DQO.USR_ID as id_user,
        DQO.PLF_ID as id_pdt,
        DQO.CON_ID as ident_pat,
        IF (DQO.DQO_DATE_ACCEPT = '0000-00-00', NULL, DQO.DQO_DATE_ACCEPT) as date_acceptation,
        DQO.DQO_BIRTHDAY as date_de_naissance_patient,
        DQO.DQO_DATE as date_devis,
        DQO.DQO_SCHEMES as dqo_schemas,
        DQO.DQO_DETAILS as details,
        DQO.DQO_IDENT_PRAT as ident_prat,
        DQO.DQO_IDENT_CONTACT as nom_prenom_patient,
        DQO.DQO_DURATION as duree_devis,
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
        DQO.DQO_PLACE_OF_MANUFACTURE as placeOfManufacture,
        DQO.DQO_PLACE_OF_MANUFACTURE_LABEL as placeOfManufactureLabel,
        DQO.DQO_WITH_SUBCONTRACTING as withSubcontracting,
        DQO.DQO_PLACE_OF_SUBCONTRACTING as placeOfSubcontracting,
        DQO.DQO_PLACE_OF_SUBCONTRACTING_LABEL as placeOfSubcontractingLabel,
        DQO.DQO_DISPLAY_NOTICE as displayNotice,
        DQO.DQO_SIGNATURE_PATIENT as signaturePatient,
        DQO.DQO_SIGNATURE_PRATICIEN as signaturePraticien,
        DQO.payment_schedule_id,
        DQO.reference,
        T_CONTACT_CON.CON_NBR AS patient_number,
        T_CONTACT_CON.CON_LASTNAME AS patient_lastname,
        T_CONTACT_CON.CON_FIRSTNAME AS patient_firstname,
        T_CONTACT_CON.CON_BIRTHDAY AS patient_birthday,
        CONCAT(T_CONTACT_CON.CON_INSEE, T_CONTACT_CON.CON_INSEE_KEY) AS patient_insee,
        T_GENDER_GEN.GEN_NAME AS patient_civility_name,
        T_GENDER_GEN.long_name AS patient_civility_long_name
      FROM T_DENTAL_QUOTATION_DQO DQO,
            T_USER_USR USR
      JOIN T_CONTACT_CON
      LEFT OUTER JOIN T_GENDER_GEN ON T_GENDER_GEN.GEN_ID = T_CONTACT_CON.GEN_ID
      WHERE DQO.DQO_ID = ${result?.id_devis}
        AND DQO.USR_ID = USR.USR_ID
        AND USR.organization_id = ${identity.org}
        AND DQO.CON_ID = T_CONTACT_CON.CON_ID
      `;
      const dentalQuotations = await this.dataSource.query(query);
      if (!dentalQuotations.length) {
        throw new CBadRequestException("Ce devis n'existe pas ... ");
      }
      const dentalQuotation = dentalQuotations[0];
      result.schemas = dentalQuotation?.schemas
        ? dentalQuotation?.schemas
        : 'none';
      result.details = dentalQuotation?.details
        ? dentalQuotation?.details
        : 'both';
      result.userPreferenceQuotationDisplayOdontogram = result.schemas;
      result.userPreferenceQuotationDisplayDetails = result.details;
      result.userPreferenceQuotationDisplayNotice =
        dentalQuotation.displayNotice;

      result.user = await this.userRepository.findOne({
        where: { id: dentalQuotation.userId },
        select: {
          password: false,
          passwordAccounting: false,
          passwordHash: false,
        },
      });
      if (result?.user) {
        delete result.user?.password;
        delete result.user?.passwordAccounting;
        delete result.user?.passwordHash;
      }
      result.id_user = dentalQuotation?.id_user;
      result.id_pdt = dentalQuotation?.id_pdt;
      result.date_acceptation = checkDay(dentalQuotation?.date_acceptation);
      result.ident_prat = br2nl(dentalQuotation?.ident_prat);
      result.ident_pat = dentalQuotation?.ident_pat;
      result.id_contact = dentalQuotation?.ident_pat;
      result.nom_prenom_patient = dentalQuotation?.nom_prenom_patient;
      result.date_de_naissance_patient =
        dentalQuotation?.date_de_naissance_patient === '0000-00-00'
          ? ''
          : dentalQuotation?.date_de_naissance_patient;
      result.date_devis =
        dentalQuotation?.date_devis === '0000-00-00'
          ? ''
          : dentalQuotation?.date_devis;
      result.duree_devis = dentalQuotation?.duree_devis;
      result.INSEE = inseeFormatter(dentalQuotation?.INSEE);
      result.adresse_pat = dentalQuotation?.adresse_pat;
      result.tel = dentalQuotation?.tel;
      result.organisme = dentalQuotation?.organisme;
      result.contrat = dentalQuotation?.contrat;
      result.ref = dentalQuotation?.ref;
      result.dispo = dentalQuotation?.dispo;
      result.dispo_desc = dentalQuotation?.dispo_desc;
      result.description = dentalQuotation?.description;
      result.quotationAmount = dentalQuotation?.amount;
      result.quotationPersonRepayment = dentalQuotation?.personRepayment;
      result.quotationPersonAmount = dentalQuotation?.personAmount;
      result.quotationPlaceOfManufacture = dentalQuotation?.placeOfManufacture;
      result.quotationPlaceOfManufactureLabel =
        dentalQuotation?.placeOfManufactureLabel;
      result.quotationWithSubcontracting = dentalQuotation?.withSubcontracting;
      result.quotationPlaceOfSubcontracting =
        dentalQuotation?.placeOfSubcontracting;
      result.quotationPlaceOfSubcontractingLabel =
        dentalQuotation?.placeOfSubcontractingLabel;
      result.quotationSignaturePatient = dentalQuotation?.signaturePatient;
      result.quotationSignaturePraticien = dentalQuotation?.signaturePraticien;
      result.paymentScheduleId = dentalQuotation?.payment_schedule_id;
      result.reference = dentalQuotation?.reference;
      result.patientNumber = dentalQuotation?.patient_number;
      result.patientLastname = dentalQuotation?.patient_lastname;
      result.patientFirstname = dentalQuotation?.patient_firstname;
      result.patientBirthday = dentalQuotation?.patient_birthday;
      result.patientInsee = dentalQuotation?.patient_insee;
      result.patientCivilityName = dentalQuotation?.patient_civility_name;
      result.patientCivilityLongName =
        dentalQuotation?.patient_civility_long_name;
      const query2 = `
      SELECT
          DQA.DQA_ID as id_devis_acte, 
          library_act_id,
          library_act_quantity_id,
          DQA.DQA_LOCATION as localisation, 
          DQA.DQA_NAME as libelle, 
          DQA.DQA_MATERIAL as materiau, 
          DQA.DQA_NGAP_CODE as cotation, 
          DQA.DQA_REFUNDABLE as remboursable,
          DQA.DQA_PURCHASE_PRICE as prixachat, 
          DQA.DQA_AMOUNT as honoraires, 
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
          DQA.DQA_PERSON_AMOUNT as personAmount
      FROM T_DENTAL_QUOTATION_ACT_DQA DQA
      WHERE DQA.DQO_ID = ${result.id_devis}
      ORDER BY DQA.DQA_ID ASC
      `;
      result.actes = await this.dataSource.query(query2);
      return result;
    } catch (error) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }
  }

  async findQuotationByID(id: number) {
    return await this.dentalQuotationRepository.find({
      where: { id: id },
      relations: {
        logo: true,
        user: true,
        contact: true,
        patient: true,
        planification: true,
        treatmentPlan: true,
        acts: true,
        paymentPlan: true,
        attachments: true,
      },
    });
  }

  async deleteQuotation(
    identity: UserIdentity,
    id: number,
  ): Promise<SuccessResponse> {
    if (
      !this.permissionService.hasPermission(
        PerCode.PERMISSION_DELETE,
        8,
        identity.id,
      )
    ) {
      throw new CForbiddenRequestException(ErrorCode.FORBIDDEN);
    }
    const quotation = await this.findQuotationByID(id);

    if (
      !quotation ||
      !quotation[0] ||
      !quotation[0].user ||
      quotation[0].user.organizationId != identity.org
    ) {
      throw new CBadRequestException(ErrorCode.DELETE_UNSUCCESSFUL);
    }

    const deleteQuotation = await this.dentalQuotationRepository.delete(id);
    if (deleteQuotation.affected === 0) {
      throw new CBadRequestException(ErrorCode.DELETE_UNSUCCESSFUL);
    }

    return {
      success: true,
    };
  }

  async patchPreferenceQuotation(
    id: number,
    identity: UserIdentity,
    payload: PreferenceQuotationDto,
  ): Promise<SuccessResponse> {
    try {
      const queryBuilder = this.dataSource
        .getRepository(UserEntity)
        .createQueryBuilder('usr');
      const user: UserEntity = await queryBuilder
        .leftJoinAndSelect('usr.userPreferenceQuotation', 'upq')
        .where('usr.id = :id', { id: id })
        .andWhere('usr.group = :groupId', { groupId: identity.org })
        .getRawOne();
      let userPreferenceQuotation =
        await this.userPreferenceQuotationRepository.findOne({
          where: {
            usrId: id,
          },
        });

      if (!userPreferenceQuotation) {
        const userPreferenceQuotationNew: UserPreferenceQuotationEntity = {
          usrId: user?.id,
        };
        userPreferenceQuotation =
          await this.userPreferenceQuotationRepository.save(
            userPreferenceQuotationNew,
          );
      }
      // Assuming payload.value is a number
      const valuePayload = `${payload.value}`;

      switch (payload.name) {
        case 'color':
          userPreferenceQuotation.color = `${payload.value}`;
        case 'placeOfManufacture':
          userPreferenceQuotation.placeOfManufacture = Number(payload.value);
        case 'placeOfManufactureLabel':
          userPreferenceQuotation.placeOfManufactureLabel = `${payload.value}`;
        case 'withSubcontracting':
          userPreferenceQuotation.withSubcontracting = Number(payload.value);
        case 'placeOfSubcontracting':
          userPreferenceQuotation.placeOfSubcontracting = Number(payload.value);
        case 'placeOfSubcontractingLabel':
          userPreferenceQuotation.placeOfSubcontractingLabel = `${payload.value}`;
        case 'displayOdontogram':
          let displayOdontogram: UserPreferenceQuotationDisplayOdontogramType;
          if (valuePayload === 'none') {
            displayOdontogram =
              UserPreferenceQuotationDisplayOdontogramType.NONE;
          } else if (valuePayload === 'both') {
            displayOdontogram =
              UserPreferenceQuotationDisplayOdontogramType.BOTH;
          } else if (valuePayload === 'three') {
            displayOdontogram =
              UserPreferenceQuotationDisplayOdontogramType.THREEE;
          } else {
            throw new CBadRequestException(
              'value not value: none, both or three',
            );
          }
          userPreferenceQuotation.displayOdontogram = displayOdontogram;
        case 'displayAnnexe':
          let displayAnnexe: UserPreferenceQuotationDisplayAnnexeType;
          if (valuePayload === 'none') {
            displayAnnexe = UserPreferenceQuotationDisplayAnnexeType.NONE;
          } else if (valuePayload === 'both') {
            displayAnnexe = UserPreferenceQuotationDisplayAnnexeType.BOTH;
          } else if (valuePayload === 'only') {
            displayAnnexe = UserPreferenceQuotationDisplayAnnexeType.ONLY;
          } else {
            throw new CBadRequestException(
              'value not value: none, both or only',
            );
          }
          userPreferenceQuotation.displayAnnexe = displayAnnexe;
        case 'displayNotice':
          userPreferenceQuotation.displayNotice = Number(payload.value);
        case 'displayTooltip':
          userPreferenceQuotation.displayTooltip = Number(payload.value);
        case 'displayDuplicata':
          userPreferenceQuotation.displayDuplicata = Number(payload.value);
        case 'treatment_timeline':
          userPreferenceQuotation.treatmentTimeline = Number(payload.value);
      }
      console.log(
        '🚀 ~ file: quotation.service.ts:1317 ~ QuotationServices ~ userPreferenceQuotation:',
        userPreferenceQuotation,
      );

      await this.userPreferenceQuotationRepository.save(
        userPreferenceQuotation,
      );

      return {
        success: true,
      };
    } catch (error) {
      console.log(
        '🚀 ~ file: quotation.service.ts:1331 ~ QuotationServices ~ error:',
        error,
      );
      throw new CBadRequestException(error?.response?.msg || error?.sqlMessage);
    }
  }
}
