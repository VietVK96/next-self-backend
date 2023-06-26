import { Injectable } from '@nestjs/common';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { BillEntity } from 'src/entities/bill.entity';
import { CaresheetStatusEntity } from 'src/entities/caresheet-status.entity';
import { CcamEntity } from 'src/entities/ccam.entity';
import { CcamFamilyEntity } from 'src/entities/ccamFamily.entity';
import { CcamMenuEntity } from 'src/entities/ccamMenu.entity';
import { CcamPanierEntity } from 'src/entities/ccamPanier.entity';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';
import { DentalEventTaskEntity } from 'src/entities/dental-event-task.entity';
import { DentalQuotationEntity } from 'src/entities/dental-quotation.entity';
import { EventOccurrenceEntity } from 'src/entities/event-occurrence.entity';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { EventEntity } from 'src/entities/event.entity';
import { FseEntity } from 'src/entities/fse.entity';
import { MedicalOrderEntity } from 'src/entities/medical-order.entity';
import { NgapKeyEntity } from 'src/entities/ngapKey.entity';
import { PlanPlfEntity } from 'src/entities/plan-plf.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource } from 'typeorm';
import { HistoricalRes } from '../response/historical.res';
import { ContactService } from './contact.service';

@Injectable()
export class HistoricalService {
  constructor(
    private dataSource: DataSource,
    private contactService: ContactService,
  ) {}

  async getALl(identity: UserIdentity, id: number): Promise<HistoricalRes[]> {
    const check = await this.contactService.verifyByIdAndGroupId(
      id,
      identity.org,
    );
    if (!check) {
      return [];
    }
    const data = await Promise.all([
      this.getAllBill(id),
      this.getAllContactNote(id),
      this.getALlMedicalOrder(id),
      this.getAllDentalQuotation(id),
      this.getAllEvent(id),
      this.getAllPrestation(id),
      this.getAllCaresheet(id),
    ]);
    return data.flat();
  }

  async getAllBill(id: number): Promise<HistoricalRes[]> {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `
      BIL.BIL_ID as id,
      BIL.BIL_DATE as date,
      BIL.BIL_AMOUNT amount,
      BIL.created_at as createdOn,
      USR.USR_ID practitionerId,
      USR.USR_ABBR practitionerAbbr,
      USR.USR_LASTNAME practitionerLastname,
      USR.USR_FIRSTNAME practitionerFirstname,
      CONCAT_WS(' ', 'Facture', BIL.BIL_NBR) as name,
      'bill' as type,
      'bill' filter
    `;

    const qr = queryBuiler
      .select(select)
      .from(BillEntity, 'BIL')
      .leftJoin(UserEntity, 'USR', 'USR.USR_ID = BIL.USR_ID')
      .where('BIL.CON_ID = :id', {
        id,
      })
      .andWhere('BIL.BIL_DELETE = 0')
      .orderBy('date', 'DESC')
      .addOrderBy('createdOn', 'DESC');

    return await qr.getRawMany();
  }

  async getAllContactNote(id: number): Promise<HistoricalRes[]> {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `
      CNO.CNO_ID as id,
      CNO.CNO_DATE as date,
      CNO.color,
      CNO.CNO_MESSAGE as name,
      CNO.created_at as createdOn,
      USR.USR_ID practitionerId,
      IFNULL(USR.USR_ABBR, '') practitionerAbbr,
      IFNULL(USR.USR_LASTNAME, '') practitionerLastname,
      IFNULL(USR.USR_FIRSTNAME, '') practitionerFirstname,
      'contactNote' as type,
      'contactNote' filter
    `;

    const qr = queryBuiler
      .select(select)
      .from(ContactNoteEntity, 'CNO')
      .leftJoin(UserEntity, 'USR', 'USR.USR_ID = CNO.user_id')
      .where('CNO.CON_ID = :id', {
        id,
      })
      .orderBy('date', 'DESC')
      .addOrderBy('createdOn', 'DESC');
    return qr.getRawMany();
  }

  async getALlMedicalOrder(id: number): Promise<HistoricalRes[]> {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `
      MDO.MDO_ID as id,
      MDO.title as name,
      MDO.MDO_DATE as date,
      MDO.created_at as createdOn,
      USR.USR_ID practitionerId,
      USR.USR_ABBR practitionerAbbr,
      USR.USR_LASTNAME practitionerLastname,
      USR.USR_FIRSTNAME practitionerFirstname,
      'medicalOrder' as type,
      'medicalOrder' filter
    `;
    const qr = queryBuiler
      .select(select)
      .from(MedicalOrderEntity, 'MDO')
      .leftJoin(UserEntity, 'USR', 'USR.USR_ID = MDO.USR_ID')
      .where('MDO.CON_ID = :id', {
        id,
      })
      .orderBy('date', 'DESC')
      .addOrderBy('createdOn', 'DESC');

    return qr.getRawMany();
  }

  async getAllDentalQuotation(id: number): Promise<HistoricalRes[]> {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `
      DQO.DQO_ID as id,
      DQO.DQO_DATE as date,
      DQO.DQO_DATE_ACCEPT dateAccept,
      DQO.DQO_AMOUNT as amount,
      DQO.DQO_TYPE as template,
      DQO.created_at as createdOn,
      USR.USR_ID practitionerId,
      USR.USR_ABBR practitionerAbbr,
      USR.USR_LASTNAME practitionerLastname,
      USR.USR_FIRSTNAME practitionerFirstname,
      IFNULL(PLF_NAME, 'Devis') AS name,
      'dentalQuotation' as type,
      'dentalQuotation' filter
    `;
    const qr = queryBuiler
      .select(select)
      .from(DentalQuotationEntity, 'DQO')
      .leftJoin(UserEntity, 'USR', 'USR.USR_ID = DQO.USR_ID')
      .leftJoin(PlanPlfEntity, 'T_PLAN_PLF', 'T_PLAN_PLF.PLF_ID = DQO.PLF_ID')
      .where('DQO.CON_ID = :id', {
        id,
      })
      .orderBy('date', 'DESC')
      .addOrderBy('createdOn', 'DESC');

    return qr.getRawMany();
  }

  async getAllEvent(id: number): Promise<HistoricalRes[]> {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `
      evo.evo_id id,
      evo.evo_date date,
      IF(EVT.EVT_STATE = 3, 'Rendez-vous décommandé', 'Absent au rendez-vous') as name,
      EVT.created_at as createdOn,
      USR.USR_ID practitionerId,
      USR.USR_ABBR practitionerAbbr,
      USR.USR_LASTNAME practitionerLastname,
      USR.USR_FIRSTNAME practitionerFirstname,
      'event' as type,
      'event' filter
      `;
    const qr = queryBuiler
      .select(select)
      .from(EventOccurrenceEntity, 'evo')
      .innerJoin(EventEntity, 'EVT', 'evo.evt_id = EVT.EVT_ID')
      .leftJoin(UserEntity, 'USR', 'USR.USR_ID = EVT.USR_ID')
      .where('EVT.CON_ID = :id', {
        id,
      })
      .andWhere(
        'EVT.EVT_DELETE = 0 AND EVT.EVT_STATE IN (2,3) AND evo.evo_exception = 0',
      )
      .orderBy('date', 'DESC')
      .addOrderBy('createdOn', 'DESC');

    return qr.getRawMany();
  }

  async getAllPrestation(id: number): Promise<HistoricalRes[]> {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `
        ETK.ETK_ID as id,
        ETK.library_act_id,
        ETK.ETK_DATE as date,
        ETK.ETK_NAME as name,
        ETK.ETK_MSG as msg,
        ETK.ETK_AMOUNT as amount,
        ETK.ETK_STATE as status,
        ETK.traceability_status,
        ETK.created_at as createdOn,
        DET.FSE_ID as caresheetId,
        DET.dental_material_id,
        DET.DET_TYPE as nomenclature,
        DET.DET_TOOTH as teeth,
        DET.DET_COEF as coef,
        DET.DET_EXCEEDING as exceeding,
        DET.DET_COMP as comp,
        DET.DET_CCAM_CODE as ccamCode,
        DET.exceptional_refund,
        ccam.id AS ccam_id,
        ccam.code AS ccam_code,
        ccam.repayable_on_condition AS ccam_repayable_on_condition,
        ccam_panier.id AS ccam_panier_id,
        ccam_panier.code AS ccam_panier_code,
        ccam_panier.label AS ccam_panier_label,
        ccam_panier.color AS ccam_panier_color,
        ccam_menu.paragraphe AS ccam_menu_paragraphe,
        ngap_key.id as ngap_key_id,
        ngap_key.name as code,
        USR.USR_ID practitionerId,
        USR.USR_ABBR practitionerAbbr,
        USR.USR_LASTNAME practitionerLastname,
        USR.USR_FIRSTNAME practitionerFirstname,
        'prestation' as type,
        'prestation' filter
      `;

    const qr = queryBuiler
      .select(select)
      .from(EventTaskEntity, 'ETK')
      .leftJoin(UserEntity, 'USR', 'USR.USR_ID = ETK.USR_ID')
      .leftJoin(DentalEventTaskEntity, 'DET', 'DET.ETK_ID = ETK.ETK_ID')
      .leftJoin(CcamEntity, 'ccam', 'ccam.id = DET.ccam_id')
      .leftJoin(
        CcamFamilyEntity,
        'ccam_family',
        'ccam_family.id = ccam.ccam_family_id',
      )
      .leftJoin(
        CcamPanierEntity,
        'ccam_panier',
        'ccam_panier.id = ccam_family.ccam_panier_id',
      )
      .leftJoin(CcamMenuEntity, 'ccam_menu', 'ccam.ccam_menu_id = ccam_menu.id')
      .leftJoin(NgapKeyEntity, 'ngap_key', 'ngap_key.id = DET.ngap_key_id')
      .leftJoin(
        EventEntity,
        'EVT',
        'EVT.EVT_ID = ETK.EVT_ID AND EVT.EVT_DELETE = 0',
      )
      .where('ETK.CON_ID = :id', {
        id,
      })
      .andWhere('ETK.ETK_STATE > 0 AND ETK.deleted_at IS NULL')
      .orderBy('date', 'DESC')
      .addOrderBy('createdOn', 'DESC');

    const data: HistoricalRes[] = await qr.getRawMany();
    return data.map((d) => {
      d.cotation = 'NPC';
      if (d.nomenclature === 'CCAM') {
        d.cotation = d.ccamCode;
      }
      if (d.nomenclature === 'NGAP') {
        if (d.code) d.cotation = `${d.code} ${d.coef}`;
      }
      return d;
    });
  }

  async getAllCaresheet(id: number) {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `
      FSE.FSE_ID as id,
      FSE.FSE_NBR as nbr,
      FSE.FSE_DATE as date,
      FSE.FSE_AMOUNT as amount,
      FSE.created_at as createdOn,
      FSE.deleted_at as deletedOn,
      caresheet_status_fse.id as caresheet_status_fse_id,
      caresheet_status_fse.value as caresheet_status_fse_value,
      caresheet_status_fse.label as caresheet_status_fse_label,
      caresheet_status_fse.description as caresheet_status_fse_description,
      caresheet_status_dre.id as caresheet_status_dre_id,
      caresheet_status_dre.value as caresheet_status_dre_value,
      caresheet_status_dre.label as caresheet_status_dre_label,
      caresheet_status_dre.description as caresheet_status_dre_description,
      USR.USR_ID practitionerId,
      USR.USR_ABBR practitionerAbbr,
      USR.USR_LASTNAME practitionerLastname,
      USR.USR_FIRSTNAME practitionerFirstname,
      IF(FSE.FSE_NBR IS NULL, 'FS Papier', CONCAT('FSE ', FSE.FSE_NBR)) name,
      'caresheet' as type,
      'caresheet' filter`;
    const qr = queryBuiler
      .select(select)
      .from(FseEntity, 'FSE')
      .leftJoin(
        CaresheetStatusEntity,
        'caresheet_status_fse',
        'caresheet_status_fse.id = FSE.fse_status_id',
      )
      .leftJoin(
        CaresheetStatusEntity,
        'caresheet_status_dre',
        'caresheet_status_dre.id = FSE.dre_status_id',
      )
      .innerJoin(UserEntity, 'USR', 'USR.USR_ID = FSE.USR_ID')
      .where('FSE.CON_ID = :id', {
        id,
      })
      .orderBy('date', 'DESC')
      .addOrderBy('createdOn', 'DESC');
    return qr.getRawMany();
  }
}
