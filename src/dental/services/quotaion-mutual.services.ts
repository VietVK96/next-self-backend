import { Injectable } from '@nestjs/common';
import { DataSource, Repository, getRepository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MedicalHeaderEntity } from 'src/entities/medical-header.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { UserIdentity } from 'src/common/decorator/auth.decorator';

import { UserEntity } from 'src/entities/user.entity';
import { DentalQuotationEntity } from 'src/entities/dental-quotation.entity';
import { DevisRequestAjaxDto } from '../dto/devis_request_ajax.dto';
import { LettersEntity } from 'src/entities/letters.entity';
import { MailService } from 'src/mail/services/mail.service';
import { UserPreferenceQuotationEntity } from 'src/entities/user-preference-quotation.entity';
import { PrintPDFDto } from '../dto/facture.dto';
import { ErrorCode } from 'src/constants/error';
import { checkId } from 'src/common/util/number';
import { PaymentScheduleService } from 'src/payment-schedule/services/payment-schedule.service';
import { customCreatePdf } from 'src/common/util/pdf';
import { QuotationMutualInitChampsDto } from '../dto/quotatio-mutual.dto';
import * as dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { PlanPlfEntity } from 'src/entities/plan-plf.entity';
import { EventEntity } from 'src/entities/event.entity';
import { br2nl } from 'src/common/util/string';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { ContactEntity } from 'src/entities/contact.entity';
import { AddressEntity } from 'src/entities/address.entity';
import { GenderEntity } from 'src/entities/gender.entity';
import { StringHelper } from 'src/common/util/string-helper';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { DentalEventTaskEntity } from 'src/entities/dental-event-task.entity';
import { NgapKeyEntity } from 'src/entities/ngapKey.entity';
import { checkDay } from 'src/common/util/day';
import { DentalQuotationActEntity } from 'src/entities/dental-quotation-act.entity';
import { BillEntity } from 'src/entities/bill.entity';
import { QuotationMutualInitByRes } from '../res/quotatio-mutual.res';
import { LibraryActQuantityEntity } from 'src/entities/library-act-quantity.entity';
dayjs.extend(utc);
dayjs.extend(dayOfYear);
@Injectable()
export class QuotationMutualServices {
  constructor(
    private mailService: MailService,
    @InjectRepository(MedicalHeaderEntity)
    private medicalHeaderRepository: Repository<MedicalHeaderEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(DentalQuotationEntity)
    private dentalQuotationRepository: Repository<DentalQuotationEntity>,
    @InjectRepository(LettersEntity)
    private lettersRepository: Repository<LettersEntity>,
    @InjectRepository(UserPreferenceQuotationEntity)
    private userPreferenceQuotationRepository: Repository<UserPreferenceQuotationEntity>,
    @InjectRepository(OrganizationEntity)
    private organizationRepo: Repository<OrganizationEntity>,
    @InjectRepository(PlanPlfEntity)
    private planRepo: Repository<PlanPlfEntity>,
    @InjectRepository(EventEntity)
    private eventRepo: Repository<EventEntity>,
    @InjectRepository(UserPreferenceQuotationEntity)
    private userPreferenceRepo: Repository<UserPreferenceQuotationEntity>,
    @InjectRepository(DentalQuotationActEntity)
    private dentalQuotationActRepo: Repository<DentalQuotationActEntity>,
    @InjectRepository(BillEntity)
    private billRepo: Repository<BillEntity>,
    @InjectRepository(LibraryActQuantityEntity)
    private libraryActQuantityRepo: Repository<LibraryActQuantityEntity>,
    private paymentScheduleService: PaymentScheduleService,
    private dataSource: DataSource,
  ) {}

  // dental/quotation-mutual/devis_requetes_ajax.php (line 7 - 270)
  async devisRequestAjax(req: DevisRequestAjaxDto, identity: UserIdentity) {
    const {
      ident_prat,
      id_pdt,
      ident_pat,
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
      signaturePatient,
      signaturePraticien,
      date_devis,
      date_de_naissance_patient,
      title,
      operation,
      attachments,
      id_devis_ligne,
      materiau,
      quotationPlaceOfManufacture,
      quotationWithSubcontracting,
      quotationPlaceOfSubcontracting,
    } = req;

    let {
      date_acceptation,
      insee,
      id_devis,
      quotationPlaceOfManufactureLabel,
      quotationPlaceOfSubcontractingLabel,
    } = req;

    if (operation === 'enregistrer') {
      try {
        if (!date_acceptation) {
          date_acceptation = null;
        } else {
          await this.dataSource.query(
            ` UPDATE T_PLAN_PLF
              JOIN T_DENTAL_QUOTATION_DQO
              SET PLF_ACCEPTED_ON = ?
              WHERE T_PLAN_PLF.PLF_ACCEPTED_ON IS NULL
                AND T_PLAN_PLF.PLF_ID = T_DENTAL_QUOTATION_DQO.PLF_ID
                AND T_DENTAL_QUOTATION_DQO.DQO_ID = ? `,
            [date_acceptation, id_devis],
          );
        }
        if (insee !== null) {
          insee = insee.replace(/\s/g, '');
        }
        const inputParameters = [
          identity?.id,
          id_pdt,
          ident_pat,
          details,
          title,
          date_acceptation,
          ident_prat,
          nom_prenom_patient,
          date_de_naissance_patient,
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
          signaturePatient ?? null,
          signaturePraticien ?? null,
          id_devis,
        ];
        await this.dataSource.query(
          `UPDATE T_DENTAL_QUOTATION_DQO DQO
          SET DQO.USR_ID = ?,
            DQO.PLF_ID = ?,
            DQO.CON_ID = ?,
            DQO.DQO_DETAILS = ?,
            DQO.DQO_TITLE = ?,
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
            DQO.DQO_SIGNATURE_PATIENT = ?,
            DQO.DQO_SIGNATURE_PRATICIEN = ?
          WHERE DQO_ID = ?`,
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
        medicalHeader.quotationMutualTitle = title;
        this.medicalHeaderRepository.save(medicalHeader);
        const quote = await this.dentalQuotationRepository
          .createQueryBuilder('quote')
          .leftJoin('quote.attachments', 'attachments')
          .where('quote.id= :id', { id: id_devis })
          .getOne();
        if (quote && quote?.attachments && quote?.attachments.length > 0) {
          quote?.attachments.forEach(async (attachment, index) => {
            await this.dentalQuotationRepository.save({
              id: attachment?.id,
              quote: null,
            });
            delete quote[index];
          });
        }
        if (attachments && attachments.length > 0) {
          attachments.map(async (id) => {
            const mail = await this.mailService.find(id);
            const context = await this.mailService.context({
              doctor_id: quote?.user?.id,
              patient_id: quote?.patient?.id,
            });
            const signature: any = {};
            if (quote?.signaturePraticien) {
              signature.practitioner = quote?.signaturePraticien;
            }
            if (quote?.signaturePraticien) {
              signature.patient = quote?.signaturePatient;
            }
            const mailConverted = await this.mailService.transform(
              mail,
              context,
              signature,
            );
            mailConverted.doctor.id = quote?.user?.id;
            mailConverted.patient.id = quote?.patient?.id;
            if (mailConverted?.header) {
              mailConverted.body = `<div class="page_header"> . ${mailConverted?.header?.body} . </div>${mailConverted?.body}`;
            }
            delete mailConverted?.header;
            delete mailConverted?.footer;
            const mailResult = await this.mailService.store(mailConverted);
            const newMail = await this.lettersRepository.findOne({
              where: { id: mailResult?.id },
            });
            const promises = [];
            for (const attachment of attachments) {
              if (attachment === newMail?.id) {
                promises.push(
                  this.lettersRepository.save({
                    id: attachment,
                    quoteId: quote?.id,
                  }),
                );
              }
            }
            await Promise.all(promises);
          });
          await this.dentalQuotationRepository.save(quote);
          return { message: `Devis enregistré correctement` };
        }
      } catch (err) {
        throw new CBadRequestException(
          `Erreur -3 : Problème durant la sauvegarde du devis ... ${err?.message}`,
        );
      }
    } else if (operation === 'checkNoFacture') {
      try {
        const dentalQuotationActId = id_devis_ligne;
        const dentalQuotationActMateriaux = materiau;
        await this.dataSource.query(
          `UPDATE T_DENTAL_QUOTATION_ACT_DQA
          SET DQA_MATERIAL = ?
          WHERE DQA_ID = ?`,
          [dentalQuotationActId, dentalQuotationActMateriaux],
        );
        return { message: `Acte de devis enregistré correctement` };
      } catch (err) {
        throw new CBadRequestException(
          `Erreur -4 : Problème durant la sauvegarde d'un acte du devis ... ${err?.message}`,
        );
      }
    } else if (operation === 'checkNoFacture') {
      try {
        id_devis = id_devis ?? 0;
        await this.dataSource.query(
          `SELECT 
            BIL.BIL_ID as id_facture,
            BIL.BIL_NBR as noFacture 
          FROM T_BILL_BIL BIL 
          WHERE BIL.BIL_ID = `,
          [id_devis],
        );
        return { message: `Acte de devis enregistré correctement` };
      } catch (err) {
        throw new CBadRequestException(
          `Erreur -5 : Problème durant la récupération du numéro de facture ... ${err?.message}`,
        );
      }
    } else if (operation === 'saveUserPreferenceQuotation') {
      const userId = identity?.id;
      const user = await this.dataSource
        .createQueryBuilder()
        .from(UserEntity, 'usr')
        .leftJoin(UserPreferenceQuotationEntity, 'upq')
        .where('usr.id =:id', { id: userId })
        .andWhere('user.group =:groupId', { group: identity?.org })
        .getRawOne();
      // const userPreferenceQuotation = user?.upq;
      if (user?.upq instanceof UserPreferenceQuotationEntity) {
        await this.userPreferenceQuotationRepository.save({ user: user });
      }
      quotationPlaceOfManufactureLabel =
        quotationPlaceOfManufactureLabel ?? null;
      quotationPlaceOfSubcontractingLabel =
        quotationPlaceOfSubcontractingLabel ?? null;
      await this.userPreferenceQuotationRepository.save({
        user,
        quotationPlaceOfManufacture,
        quotationPlaceOfManufactureLabel,
        quotationWithSubcontracting,
        quotationPlaceOfSubcontracting,
        quotationPlaceOfSubcontractingLabel,
      });
    } else {
      throw new CBadRequestException(`Erreur -2`);
    }
  }
  catch(err) {
    console.error(
      `-1002 : Probl&egrave;me durant la création de la facture. Merci de réessayer plus tard. ${err?.message}`,
    );
  }

  async sendMail(identity: UserIdentity) {
    await this.mailService.sendTest();
  }

  // dental/quotation-mutual/devis_pdf.php 45-121
  async generatePdf(req: PrintPDFDto) {
    const id = checkId(req?.id);
    try {
      // const mail =
      //   await this.mailService.findOnePaymentScheduleTemplateByDoctor(id);
      // const mailConverted = this.mailService.transform(
      //   mail,
      //   this.mailService.context({
      //     doctor_id: id_user,
      //     patient_id: id_contact,
      //     payment_schedule_id: paymentScheduleId,
      //   }),
      // );

      // const paymentSchedule = this.paymentScheduleService.find(paymentScheduleId,groupId)

      const quote = await this.dentalQuotationRepository.findOne({
        where: { id },
        relations: {
          attachments: true,
        },
      });
      console.log(
        '🚀 ~ file: devis.services.ts:336 ~ DevisServices ~ generatePdf ~ quote:',
        quote,
      );
      // Insertion des pièces jointes au PDF du devis.
      let content = '';
      if (quote && quote?.attachments) {
        quote?.attachments.map(async (attachment) => {
          const mail = await this.mailService.find(attachment?.id);
          content += await this.mailService.pdf(mail, { preview: true });
        });
      }
      console.log(
        '🚀 ~ file: devis.services.ts:345 ~ DevisServices ~ generatePdf ~ content:',
        content,
      );

      // const filePath = path.join(
      //   process.cwd(),
      //   'templates/bank_check',
      //   'bank_check.hbs',
      // );
      const options = {
        format: 'A4',
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: '<div></div>',
        margin: {
          left: '10mm',
          top: '25mm',
          right: '10mm',
          bottom: '10mm',
        },
        landscape: true,
      };
      const data = {};

      return await customCreatePdf({ htmlContent: content, options, data });
    } catch (error) {
      console.log(
        '🚀 ~ file: devis.services.ts:313 ~ DevisServices ~ generatePdf ~ error:',
        error,
      );
      throw new CBadRequestException(ErrorCode.ERROR_GET_PDF);
    }
  }

  /// dental/quotation-mutual/devis_init_champs.php
  async initChamps(
    req: QuotationMutualInitChampsDto,
    identity: UserIdentity,
    pdf = false,
  ) {
    // vérification si un numéro de plan de traitement ou de devis a été passé dans l'URL
    if (!req?.no_pdt && !req?.no_devis) {
      throw new CBadRequestException(
        'Pas de plan de traitement ni de devis s&eacute;lectionn&eacute;',
      );
    }
    let txch = 0;
    const tauxRemboursementSecu = 100; // 2013-09-06 Sébastien BORDAT Remplacement 70 par 100
    // let details = 'none';
    // let quotationSignaturePatient = null;
    // let quotationSignaturePraticien = null;
    // let userSignature = null;
    const parameters = { groupId: identity?.org };
    const group = await this.organizationRepo.findOne({
      where: { id: identity?.org },
      select: {
        ccamEnabled: true,
      },
    });
    const hasCcamEnabled = Boolean(group.ccamEnabled);
    let initData: QuotationMutualInitByRes = req?.no_pdt
      ? await this.initByPdtId(req, identity)
      : ({} as QuotationMutualInitByRes);
    initData = req?.no_devis
      ? await this.initByDevisId(req, identity)
      : initData;

    let id_facture = 0;
    let noFacture = '';

    const bill = await this.billRepo.findOne({
      where: {
        dqoId: req?.no_devis,
        delete: 0,
      },
    });
    if (bill) {
      id_facture = bill?.id;
      noFacture = bill?.nbr;
    }
    // let ident_pat = initData.ident_pat.toString();
    // let max_long_libelle = pdf ? 44 : 36;
    // let max_long_localisation = 5;
    // let ar_details = [];
    let total_prixvente = 0;
    let total_prestation = 0;
    let total_charges = 0;
    let total_honoraires = 0;

    let total_secuAmount = 0;
    let total_secuRepayment = 0;
    let total_mutualRepayment = 0;
    let total_mutualComplement = 0;
    let total_personAmount = 0;

    // let total_remboursement = 0;
    // let total_charges_patient = 0;
    let total_rss = 0;
    let total_nrss = 0;
    // let total_roc = '';

    if (!txch) {
      const query = await this.dataSource
        .createQueryBuilder()
        .select(
          'IF(IFNULL(USR_RATE_CHARGES, 0) >= 1, IFNULL(USR_RATE_CHARGES, 0) / 100, IFNULL(USR_RATE_CHARGES, 0))',
        )
        .from(UserEntity, 'T_USER_USR')
        .where('USR_ID = :id', { id: initData?.id_user })
        .getRawOne();
      if (query) txch = Number(query);
    }
    // let materials: string[] = [];
    initData?.actes?.map(async (ar_acte) => {
      const libraryActId = ar_acte?.library_act_id;
      const libraryActQuantityId = ar_acte?.library_act_quantity_id;

      if (libraryActQuantityId) {
        const libraryActQuantity = await this.libraryActQuantityRepo.findOne({
          where: { id: libraryActQuantityId },
        });
        if (libraryActQuantity?.materials)
          ar_acte.materiau = libraryActQuantity?.materials;
      }
      ar_acte.nouveau = true;
      ar_acte.prixvente = parseFloat(
        (ar_acte?.prixachat / (1 - txch)).toFixed(2),
      );
      ar_acte.prestation = parseFloat(
        (ar_acte?.honoraires * (1 - txch) - ar_acte?.prixachat).toFixed(2),
      );

      ar_acte.charges =
        ar_acte.honoraires - ar_acte.prestation - ar_acte.prixvente;
      ar_acte.honoraires =
        ar_acte.prixvente + ar_acte.prestation + ar_acte.charges;

      if (hasCcamEnabled) {
        ar_acte.rss = ar_acte.secuAmount;
      } else {
        if (ar_acte.remboursable == 'oui') {
          ar_acte.rss = (ar_acte.rss * tauxRemboursementSecu) / 100;
        }
      }

      ar_acte.nrss = ar_acte.honoraires - ar_acte.rss;
      if (Math.abs(ar_acte.nrss) < 0.01) {
        ar_acte.nrss = 0;
      }
      ar_acte.roc = '';

      total_prixvente += ar_acte.prixvente;
      total_prestation += ar_acte.prestation;
      total_charges += ar_acte.charges;
      total_honoraires += ar_acte.honoraires;
      total_rss += ar_acte.rss;
      total_nrss += ar_acte.nrss;

      total_secuAmount += ar_acte.secuAmount;
      total_secuRepayment += ar_acte.secuRepayment;
      total_mutualRepayment += ar_acte.mutualRepayment;
      total_mutualComplement += ar_acte.mutualComplement;
      total_personAmount += ar_acte.personAmount;
    });
  }

  async initByPdtId(
    req: QuotationMutualInitChampsDto,
    identity: UserIdentity,
    pdf = false,
  ): Promise<QuotationMutualInitByRes> {
    try {
      let txch = 0;
      // 2013-10-30 Sébastien BORDAT
      // Récupération de l'entité représentant le plan de traitement
      // en vérifiant qu'il appartient bien au groupe connecté
      const plan = await this.planRepo
        .createQueryBuilder('plf')
        .leftJoinAndSelect('plf.events', 'plv')
        .leftJoinAndSelect('plv.event', 'evt')
        .leftJoinAndSelect('evt.contact', 'con')
        .where('plf.id = :id', { id: req?.no_pdt })
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
      let ids_events = '';
      let last_event_id = 0;
      plan.events.forEach((event) => {
        last_event_id = event.evtId;
        ids_events += last_event_id + ', ';
      });

      ids_events = ids_events.slice(0, -2);
      // Récupération des infos utilisateur et patient
      const event = await this.eventRepo.findOne({
        where: { id: last_event_id },
      });
      if (!event) {
        throw new CBadRequestException(
          'Probl&egrave;me durant le rapatriement des informations du rendez-vous ...',
        );
      }
      const ident_pat = event.conId;

      /*
       * 2012-11-28 11:01 sébastien
       * - vérification si le rendez-vous possède un utilisateur sinon
       * on récupère l'identifiant de l'utilisateur passé en paramètre
       */
      let id_user = req?.id_user;
      if (!req?.id_user) {
        id_user = event.usrId;
        if (!id_user) {
          throw new CBadRequestException(
            'Un identifiant de praticien est requis',
          );
        }
      }

      const user = await this.userRepository.findOne({
        where: { id: id_user },
        relations: {
          type: true,
          address: true,
        },
      });
      if (!user || !user?.type?.professional) {
        throw new CBadRequestException(
          "Vous n'avez pas assez de privilège pour accéder aux factures",
        );
      }
      let ident_prat =
        user?.lastname + ' ' + user?.firstname + '\nChirurgien Dentiste';
      let adressePrat = '';
      if (user.address) {
        adressePrat = `${user?.address?.street || ''}\n${
          user?.address?.zipCode || ''
        } ${user?.address?.city || ''} \n\n`;
      }
      const userNumeroFacturant = user?.numeroFacturant;
      const userRateCharges = user?.rateCharges;
      const userSignature = user?.signature;
      if (userNumeroFacturant) {
        adressePrat += `N° ADELI : ${userNumeroFacturant}`;
      }

      if (userRateCharges) {
        txch = userRateCharges >= 1 ? userRateCharges / 100 : userRateCharges;
      }

      let title = `
      <div>
      <div style="text-align: center;"><span style="font-size: 14pt;"><strong>DEVIS MUTUELLE</strong></span></div>
      <div style="text-align: center;"><span style="font-size: 11pt;"><strong>pour traitements et actes bucco-dentaires pouvant faire l\'objet d\'une entente directe</strong></span></div>
      <div style="text-align: center;"><span style="font-size: 11pt;">Les soins &agrave; tarifs opposables ne sont pas compris dans ce devis</span></div>
      <div style="text-align: center;"><span style="font-size: 11pt;">Ce devis est la propri&eacute;t&eacute; du patient, sa communication &agrave; un tiers se fait sous sa seule reponsabilit&eacute;.</span></div>
      </div>
      `;
      const medicalHeader = await this.medicalHeaderRepository.findOne({
        where: { userId: id_user },
      });
      if (medicalHeader) {
        const medicalHeaderIdentPratQuot = medicalHeader.identPratQuot;
        title = medicalHeader?.quotationMutualTitle || title;
        if (medicalHeaderIdentPratQuot) {
          ident_prat = br2nl(medicalHeaderIdentPratQuot);
          adressePrat = '';
        } else {
          ident_prat = medicalHeader?.identPrat
            ? br2nl(medicalHeader?.identPrat)
            : ident_prat;
          adressePrat = medicalHeader?.address
            ? br2nl(medicalHeader.address)
            : adressePrat;
        }
      }

      const identPratMatched = ident_prat.match(
        '/("Entrepreneur Individuel"|"EI")/',
      );
      if (user?.freelance && !identPratMatched) {
        ident_prat = ident_prat.replace(
          `/(${user.lastname} ${user.firstname})/`,
          '$& "EI"',
        );
      } else if (!user?.freelance && identPratMatched) {
        ident_prat = ident_prat.replace(
          `/("Entrepreneur Individuel"|"EI")/`,
          '',
        );
      }

      const userPreferenceQuotation = await this.userPreferenceRepo.findOne({
        where: { usrId: id_user },
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

      if (adressePrat) {
        ident_prat = [ident_prat, adressePrat].join('\n');
      }
      const today = dayjs();
      const year = today.year();
      const dayOfYear = today.dayOfYear().toString().padStart(3, '0');
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
      const reference = `${year}${dayOfYear}-${random}`;

      //Infos patient
      const select = `
      CONCAT(CON.CON_LASTNAME, ' ', CON.CON_FIRSTNAME) as 'nom_prenom_patient',
      CON.CON_LASTNAME as patient_lastname,
      CON.CON_FIRSTNAME as patient_firstname,
      GEN.GEN_NAME AS patient_civility_name,
         CONCAT(CON.CON_INSEE,' ',CON.CON_INSEE_KEY) as 'INSEE',
         CON.CON_BIRTHDAY as 'birthday',
         CON.ADR_ID,
         CON.CON_MAIL as 'email',
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
      `;
      const patient = await this.dataSource
        .createQueryBuilder()
        .select(select)
        .from(ContactEntity, 'CON')
        .leftJoin(AddressEntity, 'ADR', 'ADR.ADR_ID = CON.ADR_ID')
        .leftJoin(GenderEntity, 'GEN', 'GEN.GEN_ID = CON.GEN_ID')
        .where('CON.CON_ID = :id', { id: ident_pat })
        .getRawOne();

      if (!patient) {
        throw new CBadRequestException(
          'Probl&egrave;me durant le rapatriement des nom et pr&eacute;nom du patient ...',
        );
      }
      const patientLastname = patient?.patient_lastname;
      const patientFirstname = patient?.patient_firstname;
      const patientCivilityName = patient?.patient_civility_name;
      const nom_prenom_patient = patient?.nom_prenom_patient;
      const INSEE = StringHelper.formatInsee(patient?.INSEE);
      const date_de_naissance_patient = patient?.birthday;
      const tel = patient?.phone;
      const email = patient?.email;
      const adresse_pat = patient?.address;

      const quotationAmount = plan?.amount;
      const quotationPersonRepayment = plan?.personRepayment;
      const quotationPersonAmount = plan?.personAmount;

      /**
       * Récupération des actes des séances
       *
       * 2013-10-07 Sébastien BORDAT
       *     Vérification si le qualificatif de dépense est "Non remboursable"
       * 2013-10-29 Sébastien BORDAT
       *     Récupération des remboursements de la mutuelle
       */
      const actes = [];
      const selectEvent = `
      library_act_id,
      library_act_quantity_id,
      ETK.ETK_NAME as 'libelle',
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
      `;
      const eventTask = await this.dataSource
        .createQueryBuilder()
        .select(selectEvent)
        .from(EventTaskEntity, 'ETK')
        .leftJoin(DentalEventTaskEntity, 'DET', 'DET.ETK_ID = ETK.ETK_ID')
        .leftJoin(NgapKeyEntity, 'ngap_key', 'ngap_key.id = DET.ngap_key_id')
        .where('ETK.EVT_ID IN :id', { id: ids_events })
        .orderBy('ETK.EVT_ID, ETK.ETK_POS')
        .getRawMany();
      eventTask?.forEach((row) => {
        const result = {
          ...row,
          cotation: 'NPC',
          tarif_secu: 0,
          rss: 0,
        };

        if (row?.type == 'CCAM') {
          result.cotation = row?.ccamCode;
          result.tarif_secu = row?.secuAmount;
          result.rss = row?.secuRepayment;
        } else if (row?.type == 'NGAP') {
          let ngapKeyName = row?.ngap_key_name;
          const ngapKeyUnitPrice = row?.ngap_key_unit_price;

          // bug#267 2013-09-25 Sébastien BORDAT
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

          result.cotation = `${row.ngapKeyName} ${parseFloat(row.coef).toFixed(
            2,
          )}`;
          result.tarif_secu = ngapKeyUnitPrice * row?.coef;
          if (row?.remboursable == 'oui') {
            result.rss = ngapKeyUnitPrice * row?.coef;
          }
        }

        actes.push(result);
      });
      const date_devis = checkDay(plan?.createdAt);
      const duree_devis = periodOfValidity;
      const organisme = ''; //"Nom de l'organisme complémentaire";
      const contrat = ''; //"N° de contrat ou d'adhérent";
      const ref = ''; //"Référence dossier";
      const dispo = false;
      const dispo_desc = '';
      const description = '';
      const date_acceptation = '';

      // Gestion de l'échéancier
      const paymentScheduleStatement = await this.planRepo.findOne({
        where: {
          id: checkId(req?.no_pdt),
        },
        select: {
          id: true,
        },
      });
      let paymentSchedule;
      let paymentScheduleId: number;
      if (paymentScheduleStatement) {
        paymentScheduleId = paymentScheduleStatement?.id;
        paymentSchedule = await this.paymentScheduleService.duplicate(
          paymentScheduleId,
          identity,
        );
      }
      // début de la transaction
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      // 2013-01-17 Sébastien BORDAT
      // Suppression de la facture anciennement liée au devis.
      // 2015-02-06 Sébastien BORDAT
      // Suppression de la vérification des clés étrangères le temps
      // de faire la suppression de la facture.
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
        await queryRunner.query(q1, [req?.no_pdt]);
        await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
        const planAmount = plan?.amount;
        const planPersonRepayment = plan?.personRepayment;
        const planPersonAmount = plan?.personAmount;

        const q2 = `
        REPLACE INTO T_DENTAL_QUOTATION_DQO (
          USR_ID, 
          PLF_ID,
          payment_schedule_id,
          DQO_TYPE,
          reference,
          DQO_TITLE, 
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
          DQO_PLACE_OF_SUBCONTRACTING_LABEL
      ) VALUES (?, ?, ?, 3, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const query2Result = await queryRunner.query(q2, [
          id_user,
          req?.no_pdt,
          paymentScheduleId || null,
          reference,
          title,
          ident_prat,
          ident_pat,
          nom_prenom_patient,
          date_devis,
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
        ]);

        const id_devis = query2Result?.raw?.insertId;
        const acts: DentalQuotationActEntity[] = actes.map((acte) => {
          return {
            DQOId: id_devis,
            libraryActId: acte?.library_act_id,
            libraryActQuantityId: acte?.library_act_quantity_id,
            location: acte?.localisation,
            name: acte?.libelle,
            material: acte?.materiau,
            ngapCode: acte?.cotation,
            purchasePrice: acte?.prixachat,
            refundable: acte?.remboursable,
            amount: acte?.honoraires,
            amountSecu: acte?.tarif_secu,
            rss: acte?.rss,
            roc: acte?.roc,
            secuAmount: acte?.secuAmount,
            secuRepayment: acte?.secuRepayment,
            mutualRepaymentType: acte?.mutualRepaymentType,
            mutualRepaymentRate: acte?.mutualRepaymentRate,
            mutualRepayment: acte?.mutualRepayment,
            mutualComplement: acte?.mutualComplement,
            personRepayment: acte?.personRepayment,
            personAmount: acte?.personAmount,
          };
        });
        await this.dentalQuotationActRepo.save(acts);
        await queryRunner.commitTransaction();
        return {
          txch,
          ident_prat,
          ident_pat,
          nom_prenom_patient,
          date_de_naissance_patient,
          date_devis,
          duree_devis,
          INSEE,
          adresse_pat,
          tel,
          contrat,
          dispo_desc,
          organisme,
          ref,
          paymentSchedule,
          dispo,
          description,
          date_acceptation,
          email,
          patientCivilityName,
          patientFirstname,
          patientLastname,
          quotationAmount,
          quotationPersonAmount,
          quotationPersonRepayment,
          userSignature,
          id_user,
          actes,
        };
      } catch (err) {
        await queryRunner.rollbackTransaction();
      } finally {
        await queryRunner.release();
      }
    } catch (error) {}
  }

  async initByDevisId(
    req: QuotationMutualInitChampsDto,
    identity: UserIdentity,
    pdf = false,
  ): Promise<QuotationMutualInitByRes> {
    try {
      const txch = 0;
      const select = `
      DQO.USR_ID as id_user,
      DQO.PLF_ID as id_pdt,
      DQO.CON_ID as ident_pat,
      IF (DQO.DQO_DATE_ACCEPT = '0000-00-00', NULL, DQO.DQO_DATE_ACCEPT) as date_acceptation,
      DQO.DQO_BIRTHDAY as date_de_naissance_patient,
      DQO.DQO_DATE as date_devis,
      DQO.DQO_TITLE as title,
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
      DQO.DQO_SIGNATURE_PATIENT as signaturePatient,
      DQO.DQO_SIGNATURE_PRATICIEN as signaturePraticien,
      DQO.payment_schedule_id,
      DQO.reference,
      CON.CON_NBR AS patient_number,
      CON.CON_LASTNAME AS patient_lastname,
      CON.CON_FIRSTNAME AS patient_firstname,
      CON.CON_BIRTHDAY AS patient_birthday,
      CONCAT(CON.CON_INSEE, CON.CON_INSEE_KEY) AS patient_insee,
      T_GENDER_GEN.GEN_NAME AS patient_civility_name,
      T_GENDER_GEN.long_name AS patient_civility_long_name
      `;
      const dentalQuotation = await this.dataSource
        .createQueryBuilder()
        .select(select)
        .from(DentalQuotationEntity, 'DQO')
        .innerJoin(UserEntity, 'USR')
        .innerJoin(ContactEntity, 'CON')
        .leftJoin(GenderEntity, 'GEN', 'GEN.GEN_ID = CON.GEN_ID')
        .where('DQO.DQO_ID = :id', { id: req?.no_devis })
        .andWhere('DQO.USR_ID = USR.USR_ID')
        .andWhere('USR.organization_id = :group', { group: identity.org })
        .andWhere('DQO.CON_ID = CON.CON_ID')
        .getRawOne();
      if (!dentalQuotation) {
        throw new CBadRequestException("Ce devis n'existe pas ...");
      }
      const id_user = dentalQuotation?.id_user;
      const id_pdt = dentalQuotation?.id_pdt;
      const date_acceptation = checkDay(dentalQuotation?.date_acceptation);
      const ident_prat = br2nl(dentalQuotation?.ident_prat?.trim());
      const ident_pat = dentalQuotation?.ident_pat;
      const id_contact = dentalQuotation?.ident_pat;
      const nom_prenom_patient = dentalQuotation?.nom_prenom_patient;
      const date_de_naissance_patient = checkDay(
        dentalQuotation?.date_de_naissance_patient,
      );
      const date_devis = checkDay(dentalQuotation?.date_devis);
      const duree_devis = dentalQuotation?.duree_devis;
      const INSEE = StringHelper.formatInsee(dentalQuotation.INSEE);
      const adresse_pat = dentalQuotation?.adresse_pat;
      const tel = dentalQuotation?.tel;
      const organisme = dentalQuotation?.organisme;
      const contrat = dentalQuotation?.contrat;
      const ref = dentalQuotation?.ref;
      const dispo = dentalQuotation?.dispo;
      const dispo_desc = dentalQuotation?.dispo_desc;
      const description = dentalQuotation?.description;
      const title = dentalQuotation?.title;

      const quotationAmount = dentalQuotation?.amount;
      const quotationPersonRepayment = dentalQuotation?.personRepayment;
      const quotationPersonAmount = dentalQuotation?.personAmount;
      const quotationPlaceOfManufacture = dentalQuotation?.placeOfManufacture;
      const quotationPlaceOfManufactureLabel =
        dentalQuotation?.placeOfManufactureLabel;
      const quotationWithSubcontracting = dentalQuotation?.withSubcontracting;
      const quotationPlaceOfSubcontracting =
        dentalQuotation?.placeOfSubcontracting;
      const quotationPlaceOfSubcontractingLabel =
        dentalQuotation?.placeOfSubcontractingLabel;
      const quotationSignaturePatient = dentalQuotation?.signaturePatient;
      const quotationSignaturePraticien = dentalQuotation?.signaturePraticien;

      const paymentScheduleId = dentalQuotation?.payment_schedule_id;
      const reference = dentalQuotation?.reference;
      const patientNumber = dentalQuotation?.patient_number;
      const patientLastname = dentalQuotation?.patient_lastname;
      const patientFirstname = dentalQuotation?.patient_firstname;
      const patientBirthday = dentalQuotation?.patient_birthday;
      const patientInsee = dentalQuotation?.patient_insee;
      const patientCivilityName = dentalQuotation?.patient_civility_name;
      const patientCivilityLongName =
        dentalQuotation?.patient_civility_long_name;
      const actes = [];
      const select2 = `
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
      `;
      const query2Result = await this.dataSource
        .createQueryBuilder()
        .select(select2)
        .from(DentalQuotationActEntity, 'DQA')
        .where('DQA.DQO_ID = :id', { id: req?.no_devis })
        .orderBy('DQA.DQA_ID ASC')
        .getRawMany();
      if (query2Result) {
        query2Result.forEach((e) => [actes.push(e)]);
      }

      return {
        txch,
        ident_prat,
        ident_pat,
        nom_prenom_patient,
        date_de_naissance_patient,
        date_devis,
        duree_devis,
        INSEE,
        adresse_pat,
        tel,
        contrat,
        dispo_desc,
        organisme,
        ref,
        paymentSchedule: null,
        dispo,
        description,
        date_acceptation,
        email: '',
        patientCivilityName,
        patientFirstname,
        patientLastname,
        quotationAmount,
        quotationPersonAmount,
        quotationPersonRepayment,
        userSignature: '',
        id_user,
        actes,
      };
    } catch (error) {}
  }
}
