import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
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
import * as fs from 'fs-extra';
import { PrintPDFDto } from '../dto/facture.dto';
import { ErrorCode } from 'src/constants/error';
import { checkId } from 'src/common/util/number';
import { PaymentScheduleService } from 'src/payment-schedule/services/payment-schedule.service';
import * as path from 'path';
import { customCreatePdf } from 'src/common/util/pdf';
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
}
