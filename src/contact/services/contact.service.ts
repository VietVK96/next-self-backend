import { Injectable } from '@nestjs/common';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { ErrorCode } from 'src/constants/error';
import { AddressEntity } from 'src/entities/address.entity';
import {
  ContactDocumentEntity,
  EnumContactDocumentType,
} from 'src/entities/contact-document.entity';
import { ContactPhoneCopEntity } from 'src/entities/contact-phone-cop.entity';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { ContactEntity } from 'src/entities/contact.entity';
import { CorrespondentEntity } from 'src/entities/correspondent.entity';
import { GenderEntity } from 'src/entities/gender.entity';
import { PatientAmoEntity } from 'src/entities/patient-amo.entity';
import { PatientMedicalEntity } from 'src/entities/patient-medical.entity';
import { PhoneTypeEntity } from 'src/entities/phone-type.entity';
import { PhoneEntity } from 'src/entities/phone.entity';
import { UploadEntity } from 'src/entities/upload.entity';
import { UserEntity } from 'src/entities/user.entity';
import { PatientAmcEntity } from 'src/entities/patient-amc.entity';
import { DataSource, Repository } from 'typeorm';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { ContactPatchDto } from '../dto/contact.payment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ConfigService } from '@nestjs/config';
import { checkEmpty } from 'src/common/util/string';
import * as fs from 'fs';
import { checkId } from 'src/common/util/number';

@Injectable()
export class ContactService {
  constructor(
    private configService: ConfigService,
    private dataSource: DataSource,
    @InjectRepository(ContactEntity)
    private contactRepository: Repository<ContactEntity>,
    @InjectRepository(PatientAmoEntity)
    private patientAmoRepo: Repository<PatientAmoEntity>,
    @InjectRepository(PatientAmcEntity)
    private patientAmcRepo: Repository<PatientAmcEntity>,
  ) {}

  async verifyByIdAndGroupId(id: number, orgId: number): Promise<boolean> {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `COUNT(CON_ID) as countId`;
    const qr = queryBuiler
      .select(select)
      .from(ContactEntity, 'CON')
      .where('CON.CON_ID = :id', {
        id,
      })
      .andWhere('CON.organization_id = :orgId', {
        orgId,
      });

    const { countId }: { countId: number } = await qr.getRawOne();
    return countId > 0;
  }

  /**
   * Convert from application\Services\Contact.php 38->233
   * sometimes i ask what is my doing
   *
   */
  async findOne(id: number, doctorId: number, identity: UserIdentity) {
    id = checkId(id);
    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `
      CON.CON_ID as id,
      CON.CON_NBR as nbr,
      CON.CON_LASTNAME as lastname,
      CON.CON_FIRSTNAME as firstname,
      CON.CON_MAIL as email,
      CON.CON_PROFESSION as profession,
      CON.CON_BIRTHDAY as birthday,
      CON.CON_BIRTH_ORDER as birthOrder,
      IFNULL(CON.CON_QUALITY, 0) as quality,
      CON.CON_BREASTFEEDING as breastfeeding,
      CON.CON_PREGNANCY as pregnancy,
      CON.CON_CLEARANCE_CREATININE as clearanceCreatinine,
      CON.CON_HEPATIC_INSUFFICIENCY as hepaticInsufficiency,
      CON.CON_WEIGHT as weight,
      CON.CON_SIZE as size,
      CON.CON_MSG as msg,
      CON.odontogram_observation,
      CON.CON_NOTIFICATION_MSG as notificationMsg,
      CON.CON_NOTIFICATION_ENABLE as notificationEnable,
      CON.CON_NOTIFICATION_EVERY_TIME as notificationEveryTime,
      CON.CON_REMINDER_VISIT_TYPE as reminderVisitType,
      CON.CON_REMINDER_VISIT_DURATION as reminderVisitDuration,
      CON.CON_REMINDER_VISIT_DATE as reminderVisitDate,
      CON.CON_REMINDER_VISIT_LAST_DATE as reminderVisitLastDate,
      CON.CON_COLOR as color,
      CON.CON_COLOR_MEDICAL as colorMedical,
      CON.CON_INSEE as insee,
      CON.CON_INSEE_KEY as inseeKey,
      CON.social_security_reimbursement_rate,
      CON.CON_MUTUAL_REPAYMENT_TYPE as mutualRepaymentType,
      CON.CON_MUTUAL_REPAYMENT_RATE as mutualRepaymentRate,
      CON.CON_MUTUAL_COMPLEMENT as mutualComplement,
      CON.CON_MUTUAL_CEILING as mutualCeiling,
      CON.CON_AGENESIE as agenesie,
      CON.CON_MALADIE_RARE as maladieRare,
      CON.CON_RX_SIDEXIS_LOADED as rxSidexisLoaded,
      CON.COF_ID as contactFamilyId,
      CON.external_reference_id,
      GEN.GEN_ID as genderId,
      GEN.GEN_NAME as genderName,
      GEN.GEN_TYPE as genderType,
      ADR.ADR_ID as addressId,
      ADR.ADR_STREET as addressStreet,
      ADR.ADR_STREET_COMP as addressStreetComp,
      ADR.ADR_ZIP_CODE as addressZipCode,
      ADR.ADR_CITY as addressCity,
      ADR.ADR_COUNTRY as addressCountry,
      ADR.ADR_COUNTRY_ABBR as addressCountryAbbr,
      CPD.CPD_ID as doctor_id,
      CPD.CPD_LASTNAME as doctor_last_name,
      CPD.CPD_FIRSTNAME as doctor_first_name,
      CPD1.CPD_ID as addressed_by_id,
      CPD1.CPD_LASTNAME as addressed_by_last_name,
      CPD1.CPD_FIRSTNAME as addressed_by_first_name,
      USR.USR_ID as practitionerId,
      USR.USR_ABBR as practitionerAbbr,
      USR.USR_LASTNAME as practitionerLastname,
      USR.USR_FIRSTNAME as practitionerFirstname,
      UPL.UPL_ID as avatarId,
      UPL.UPL_TOKEN as avatarToken,
      IFNULL(cou.cou_amount_due, 0) as amountDue,
      IFNULL(cou.amount_due_care, 0) as amountDueCare,
      IFNULL(cou.amount_due_prosthesis, 0) as amountDueProsthesis,
      IFNULL(cou.third_party_balance, 0) as third_party_balance,
      cou.cou_last_payment as lastPayment,
      cou.cou_last_care as lastCare
    `;
    const qr = queryBuiler
      .select(select)
      .from(ContactEntity, 'CON')
      .leftJoin(GenderEntity, 'GEN', 'CON.GEN_ID = GEN.GEN_ID')
      .leftJoin(AddressEntity, 'ADR', 'ADR.ADR_ID = CON.ADR_ID')
      .leftJoin(
        CorrespondentEntity,
        'CPD',
        'CPD.CPD_ID = CON.CON_MEDECIN_TRAITANT',
      )
      .leftJoin(CorrespondentEntity, 'CPD1', 'CPD1.CPD_ID = CON.CPD_ID')
      .leftJoin(UserEntity, 'USR', 'USR.USR_ID = CON.USR_ID')
      .leftJoin(UploadEntity, 'UPL', 'UPL.UPL_ID = CON.UPL_ID')
      .leftJoin(
        ContactUserEntity,
        'cou',
        'cou.con_id = CON.CON_ID AND cou.usr_id = :usrId',
        {
          usrId: doctorId,
        },
      )
      .where('CON.CON_ID = :id AND CON.organization_id = :orgId', {
        id: id || 0,
        orgId: identity.org,
      });
    const record = await qr.getRawOne();
    if (!record) {
      throw new CNotFoundRequestException(ErrorCode.NOT_FOUND_PATIENT);
    }
    record.phones = await this.findPhone(id);
    if (record.contactFamilyId) {
      record.members = await this.getMembers(
        id,
        doctorId,
        record.contactFamilyId,
      );
    }

    const countDocument = await this.getCountDocument(id);
    record.document_count = countDocument?.documentCount ?? 0;
    record.image_count = countDocument?.imageCount ?? 0;
    record.medical = await this.findMedical(id);
    record.amos = await this.findAmos(id);
    record.amcs = await this.findAmcs(id);

    const image = await this.findLibraryLink(id);
    record.image_library_link = image?.image_library_link ?? null;
    return record;
  }

  async findPhone(id: number) {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `
PHO.PHO_ID as id,
PHO.PHO_NBR as nbr,
PTY.PTY_ID as phoneTypeId,
PTY.PTY_NAME as phoneTypeName
    `;

    const qr = queryBuiler
      .select(select)
      .from(ContactPhoneCopEntity, 'COP')
      .innerJoin(PhoneEntity, 'PHO', 'PHO.PHO_ID = COP.PHO_ID')
      .innerJoin(PhoneTypeEntity, 'PTY', 'PTY.PTY_ID = PHO.PTY_ID')
      .where('COP.CON_ID = :id', {
        id,
      });
    return qr.getRawMany();
  }

  async getMembers(id: number, doctorId: number, contactFamilyId: number) {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `
    CON.CON_ID as id,
    CON.CON_NBR as nbr,
    CON.CON_LASTNAME as lastname,
    CON.CON_FIRSTNAME as firstname,
    CON.CON_COLOR as color,
    IFNULL(cou.cou_amount_due, 0) as amountDue,
    IFNULL(cou.amount_due_care, 0) as amountDueCare,
    IFNULL(cou.amount_due_prosthesis, 0) as amountDueProsthesis,
    cou.cou_last_payment as lastPayment,
    cou.cou_last_care as lastCare
    `;
    const qr = queryBuiler
      .select(select)
      .from(ContactEntity, 'CON')
      .leftJoin(
        ContactUserEntity,
        'cou',
        'cou.con_id = CON.CON_ID AND cou.usr_id = :doctorId',
        {
          doctorId,
        },
      )
      .where('CON.COF_ID = :contactFamilyId AND CON.CON_ID != :id', {
        contactFamilyId,
        id,
      })
      .orderBy('CON.CON_LASTNAME, CON.CON_FIRSTNAME');

    return qr.getRawMany();
  }

  async getCountDocument(id: number): Promise<{
    documentCount: number;
    imageCount: number;
  }> {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `
count(CON_ID) as countId,COD_TYPE as codType
`;
    const qr = queryBuiler
      .select(select)
      .from(ContactDocumentEntity, 'COD')
      .where(`CON_ID = :id AND COD_TYPE IN ('file', 'rx')`, {
        id,
      })
      .groupBy('COD_TYPE');
    const data: { countId: number; codType: string }[] = await qr.getRawMany();

    const re: {
      documentCount: number;
      imageCount: number;
    } = {
      documentCount: 0,
      imageCount: 0,
    };
    if (data.length > 0) {
      const document = data.find(
        (d) => d.codType === EnumContactDocumentType.FILE,
      );
      if (document && document.countId) {
        re.documentCount = document.countId;
      }

      const image = data.find((d) => d.codType === EnumContactDocumentType.RX);
      if (image && image.countId) {
        re.imageCount = image.countId;
      }
    }
    return re;
  }

  async findMedical(id: number) {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const qr = queryBuiler
      .select('*')
      .from(PatientMedicalEntity, 'pme')
      .where(`patient_id = :id`, {
        id,
      });

    return qr.getRawOne();
  }

  async findAmos(id: number) {
    return await this.patientAmoRepo.find({
      where: {
        patientId: id,
      },
    });
  }

  async findAmcs(id: number) {
    return await this.patientAmcRepo.find({
      where: {
        patientId: id,
      },
    });
  }

  async findLibraryLink(id: number): Promise<{
    image_library_link?: string;
  }> {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const qr = queryBuiler
      .select('image_library_link')
      .from(OrganizationEntity, 'T_GROUP_GRP')
      .innerJoin(
        ContactEntity,
        'T_CONTACT_CON',
        'T_GROUP_GRP.GRP_ID = T_CONTACT_CON.organization_id',
      )
      .where(`T_CONTACT_CON.CON_ID = :id`, {
        id,
      });
    return qr.getRawOne();
  }

  async getAmountDue(patientId?: number, practitionerId?: number) {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const obj = await queryBuiler
      .select(
        `contact_user_cou.cou_amount_due AS amount_due,
      contact_user_cou.amount_due_care,
      contact_user_cou.amount_due_prosthesis`,
      )
      .from(ContactUserEntity, 'contact_user_cou')
      .where(
        `contact_user_cou.con_id = :patientId 
      AND contact_user_cou.usr_id = :practitionerId`,
        { patientId, practitionerId },
      )
      .execute();
    if (obj) {
      return {
        amount_due: 0,
        amount_due_care: 0,
        amount_due_prosthesis: 0,
      };
    }
    return obj;
  }

  async patch(payload: ContactPatchDto) {
    try {
      switch (payload.name) {
        case 'weight': {
          await this.contactRepository.save({
            id: payload?.pk,
            weight: +payload.value,
          });
          break;
        }
        case 'size': {
          await this.contactRepository.save({
            id: payload?.pk,
            size: +payload.value,
          });
          break;
        }
        case 'clearanceCreatinine': {
          await this.contactRepository.save({
            id: payload?.pk,
            clearanceCreatinine: +payload.value,
          });
          break;
        }
        case 'pregnancy': {
          await this.contactRepository.save({
            id: payload?.pk,
            pregnancy: +payload.value,
          });
          break;
        }
        case 'breastfeeding': {
          await this.contactRepository.save({
            id: payload?.pk,
            breastfeeding: +payload.value,
          });
          break;
        }
        case 'hepaticInsufficiency': {
          await this.contactRepository.save({
            id: payload?.pk,
            hepaticInsufficiency: `${payload?.value}`,
          });
          break;
        }
        case 'msg': {
          await this.contactRepository.save({
            id: payload?.pk,
            msg: `${payload?.value}`,
          });
          break;
        }
        case 'color': {
          await this.contactRepository.save({
            id: payload?.pk,
            color: +payload?.value,
          });
          break;
        }
        case 'notificationMsg': {
          await this.contactRepository.save({
            id: payload?.pk,
            notificationMsg: `${payload?.value}`,
          });
          break;
        }
        default:
          throw new CBadRequestException(
            'The value of the "name" parameter is incorrect',
          );
      }
    } catch {
      throw new CNotFoundRequestException(
        ErrorCode.STATUS_INTERNAL_SERVER_ERROR,
      );
    }
  }
  /**
   * File: php/contact/next.php
   * Line 13 -> 60
   */
  async getNextContact(
    contact: number,
    practitioner: number,
    identity: UserIdentity,
  ) {
    try {
      const nextContactQuery = `
      SELECT EVT.CON_ID as id
      FROM T_EVENT_EVT EVT
      WHERE EVT.EVT_ID = (
        SELECT EVT.EVT_ID
        FROM T_EVENT_EVT EVT
        WHERE EVT.USR_ID = ?
        AND EVT.EVT_DELETE = 0
          AND EVT.EVT_STATE NOT IN (2,3)
          AND EVT.EVT_START > (
            SELECT EVT.EVT_START
            FROM T_EVENT_EVT EVT
            JOIN T_USER_USR USR ON USR.USR_ID = EVT.USR_ID AND USR.organization_id = ?
            WHERE DATE(EVT.EVT_START) = CURDATE()
            AND EVT.USR_ID = ?
            AND EVT.CON_ID = ?
              AND EVT.EVT_DELETE = 0
            LIMIT 1
          )
          ORDER BY EVT.EVT_START
          LIMIT 1
          )`;
      const nextIdResult = await this.dataSource.query(nextContactQuery, [
        practitioner,
        identity.org,
        practitioner,
        contact,
      ]);
      const nextId = nextIdResult[0];
      if (!nextId) {
        throw new CBadRequestException(
          "Aucun patient du jour suivant n'a été trouvé.",
        );
      }
      return nextId;
    } catch (error) {
      throw new CBadRequestException(error?.response?.msg || error?.sqlMessage);
    }
  }

  /**
   * php/contact/previous.php
   * Line 13 -> 56
   */
  async getPreviousContact(contact: number, practitioner: number) {
    try {
      const previousContactQuery = `
      SELECT EVT.CON_ID as id
        FROM T_EVENT_EVT EVT
        WHERE EVT.EVT_ID = (
            SELECT EVT.EVT_ID
            FROM T_EVENT_EVT EVT
            WHERE EVT.USR_ID = ?
              AND EVT.EVT_DELETE = 0
              AND EVT.EVT_STATE NOT IN (2,3)
              AND EVT.EVT_START < (
                SELECT EVT.EVT_START
                FROM T_EVENT_EVT EVT
                WHERE DATE(EVT.EVT_START) = CURDATE()
                  AND EVT.USR_ID = ?
                  AND EVT.CON_ID = ?
                  AND EVT.EVT_DELETE = 0
                LIMIT 1
              )
            ORDER BY EVT.EVT_START DESC
            LIMIT 1
        )`;
      const previousIdResult = await this.dataSource.query(
        previousContactQuery,
        [practitioner, practitioner, contact],
      );
      const previousId = previousIdResult[0];
      if (!previousId) {
        throw new CBadRequestException(
          "Aucun patient du jour suivant n'a été trouvé.",
        );
      }
      return previousId;
    } catch (error) {
      throw new CBadRequestException(error?.response?.msg || error?.sqlMessage);
    }
  }

  async getAvatar(contactId: number) {
    try {
      const query = this.dataSource.createQueryBuilder();
      const uplId = await query
        .select('CON.UPL_ID')
        .from(ContactEntity, 'CON')
        .where('CON.CON_ID = :contactId', { contactId })
        .getRawOne();
      if (!uplId.UPL_ID) return null;

      const fileC = await this.dataSource
        .createQueryBuilder()
        .select()
        .from(UploadEntity, 'UPL')
        .where('UPL.UPL_ID = :id', { id: uplId?.UPL_ID })
        .getRawOne();
      if (!fileC) return null;

      const filename = fileC?.UPL_NAME;
      const path = fileC?.UPL_PATH;
      const dir = await this.configService.get('app.uploadDir');
      if (!fs.existsSync(`${dir}/${path}${filename}`)) return null;

      return { file: `${dir}/${path}${filename}` };
    } catch (error) {
      return null;
    }
  }

  /**
   * /application/Entity/Patient.php
   * Line 805-> 820
   */
  async isCmu(datetime: string, patient: ContactEntity) {
    const activeCmu = this.getActiveAmc(datetime, patient);
    const medical = patient?.medical;
    if (activeCmu) {
      return !!activeCmu?.isCmu;
    }
    if (medical) {
      return this.isActiveAcsMedical(medical);
    }
    return false;
  }

  /**
   * /application/Entity/Patient.php
   * Line 599-> 610
   */
  getActiveAmc(datetime: string, patient: ContactEntity) {
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
  isActiveAcsMedical(medical: PatientMedicalEntity) {
    const now = new Date();
    return (
      ['11', '12', '13', '14'].includes(medical?.serviceAmoCode) &&
      (!medical?.serviceAmoStartDate ||
        now.getTime() >= new Date(medical?.serviceAmoStartDate).getTime()) &&
      (!medical?.serviceAmoEndDate ||
        now.getTime() <= new Date(medical?.serviceAmoEndDate).getTime())
    );
  }
}
