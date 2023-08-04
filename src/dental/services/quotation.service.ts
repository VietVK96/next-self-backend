import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MedicalHeaderEntity } from 'src/entities/medical-header.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { UserEntity } from 'src/entities/user.entity';
import { QuotationDevisRequestAjaxDto } from '../dto/devis_request_ajax.dto';
import { UserPreferenceQuotationEntity } from 'src/entities/user-preference-quotation.entity';
import { QuotationInitChampsDto } from '../dto/quotation.dto';
import { ErrorCode } from 'src/constants/error';

@Injectable()
export class QuotationServices {
  constructor(
    @InjectRepository(MedicalHeaderEntity)
    private medicalHeaderRepository: Repository<MedicalHeaderEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(UserPreferenceQuotationEntity)
    private userPreferenceQuotationRepository: Repository<UserPreferenceQuotationEntity>,

    private dataSource: DataSource,
  ) {}

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
    try {
    } catch (error) {
      console.log(
        '🚀 ~ file: quotation.service.ts:243 ~ QuotationServices ~ initChamps ~ error:',
        error,
      );
      throw new CBadRequestException(ErrorCode.INVALID_PARAMETER);
    }
  }
}
