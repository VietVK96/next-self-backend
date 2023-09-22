import { Injectable } from '@nestjs/common';
import { AddressEntity } from 'src/entities/address.entity';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { ContactEntity } from 'src/entities/contact.entity';
import { EventEntity } from 'src/entities/event.entity';
import { GenderEntity } from 'src/entities/gender.entity';
import { PhoneEntity } from 'src/entities/phone.entity';
import { UserEntity } from 'src/entities/user.entity';
import {
  DataSource,
  Repository,
  SelectQueryBuilder,
  EntityManager,
} from 'typeorm';
import {
  FindAllContactDto,
  FindAllStructDto,
} from '../dto/findAll.contact.dto';
import { FindAllContactRes } from '../response/findall.contact.res';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import {
  contactPhoneRes,
  FindAllRecentlyTreatedRes,
} from '../response/findall.recentlyTreated.res';
import { InjectRepository } from '@nestjs/typeorm';
import { CorrespondentEntity } from 'src/entities/correspondent.entity';
import { FindRetrieveRes } from '../response/find.retrieve.contact.res';

@Injectable()
export class FindContactService {
  private operators = [
    'like',
    'not like',
    '<',
    '<=',
    '=',
    '!=',
    '>=',
    '>',
    'is null',
    'is not null',
  ];

  private fields = {
    lastname: 'CON.CON_LASTNAME',
    firstname: 'CON.CON_FIRSTNAME',
    number: 'CON.CON_NBR',
    inseeNumber: 'CON.CON_INSEE',
    email: 'CON.CON_MAIL',
    birthDate: 'CON.CON_BIRTHDAY',
    phoneNumber: 'PHO.PHO_NBR',
    zipCode: 'ADR.ADR_ZIP_CODE',
    city: 'ADR.ADR_CITY',
  };

  constructor(
    private dataSource: DataSource,
    @InjectRepository(ContactEntity)
    private contactRepo: Repository<ContactEntity>,
    @InjectRepository(CorrespondentEntity)
    private correspondentRepo: Repository<CorrespondentEntity>,
    private entityManager: EntityManager,
  ) {}

  // Convert function from application\Services\SearchCriteria.php
  addWhere(
    qr: SelectQueryBuilder<ContactUserEntity>,
    conditions: FindAllStructDto[],
  ) {
    const noNeedAddParam = ['is null', 'is not null'];
    for (const condition of conditions) {
      if (this.operators.indexOf(condition.op) > -1) {
        let query = ``;
        if (noNeedAddParam.indexOf(condition.op) > -1) {
          qr.andWhere(`${this.fields[condition.field]} ${condition.op}`);
        } else {
          query = `${this.fields[condition.field]} ${condition.op} :con`;
          qr.andWhere(query, {
            con: condition.value,
          });
        }
      }
    }
    return qr;
  }

  /**
   * File: php/contact/findAll.php 21-91
   * @function main function
   *
   */
  async findAll(
    request: FindAllContactDto,
    doctorId: number,
    organizationId: number,
  ): Promise<FindAllContactRes[]> {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `
            CON.CON_ID as id,
            CON.CON_ID as DT_RowId,
            CON.CON_ID as value,
            CON.CON_NBR as nbr,
            CON.CON_LASTNAME as lastname,
            CON.CON_FIRSTNAME as firstname,
           CON.CON_BIRTHDAY as birthday,
            CON.CON_MSG as msg,
            CON.CON_INSEE as insee_number,
            CON.CON_INSEE_KEY as insee_number_key,
            CON.CON_COLOR as color,
            CONCAT_WS(' ', T_GENDER_GEN.GEN_NAME, CON_LASTNAME, CON_FIRSTNAME) as label,
            GROUP_CONCAT(DISTINCT PHO.PHO_NBR) as phones,
            cou.cou_amount_due as amountDue,
            USR.USR_ID as practitionerId,
            USR.USR_ABBR as practitionerAbbr,
            USR.USR_LASTNAME as practitionerLastname,
            USR.USR_FIRSTNAME as practitionerFirstname`;
    let qr = queryBuiler
      .select(select)
      .from(ContactEntity, 'CON')
      .leftJoin(UserEntity, 'USR', 'USR.USR_ID = CON.USR_ID')
      .leftJoin(AddressEntity, 'ADR', 'ADR.ADR_ID = CON.ADR_ID')
      .leftJoin('T_CONTACT_PHONE_COP', 'COP', 'COP.CON_ID = CON.CON_ID')
      .leftJoin(PhoneEntity, 'PHO', 'PHO.PHO_ID = COP.PHO_ID')
      .leftJoin(
        ContactUserEntity,
        'cou',
        `cou.con_id = CON.CON_ID AND cou.usr_id = :doctorId`,
        {
          doctorId,
        },
      )
      .leftJoin(
        GenderEntity,
        'T_GENDER_GEN',
        'T_GENDER_GEN.GEN_ID = CON.GEN_ID',
      );
    // Start $searchCriteria = new \App\Services\SearchCriteria($connection, $fields, $conditions);
    if (request?.conditions && request?.conditions.length > 0) {
      for (const condition of request?.conditions) {
        if (condition?.value?.length < 2) {
          return [];
        }
      }
      qr = this.addWhere(qr, request?.conditions);
    }
    qr.andWhere('CON.organization_id = :id', {
      id: organizationId,
    });
    qr.andWhere('CON.deleted_at IS NULL');
    qr.addGroupBy('CON.CON_ID');
    qr.addOrderBy('CON.CON_LASTNAME , CON.CON_FIRSTNAME', 'ASC');
    const contacts: FindAllContactRes[] = await qr.getRawMany();
    const conIds = contacts.map((a) => a.id);

    /**
     * Logic in php/contact/findAll.php line 34 and line 79->82
     */
    if (conIds && conIds.length > 0) {
      const reliabilityQr = this.dataSource
        .createQueryBuilder()
        .from(EventEntity, 'EVT');

      reliabilityQr.select(
        `COALESCE(100 * SUM(IF(lateness = 0 AND EVT.EVT_STATE NOT IN (2, 3), 1, 0)) / COUNT(EVT_ID), 0) as reliability, EVT.CON_ID as conId`,
      );
      reliabilityQr.andWhere(
        'EVT.CON_ID IN (:conIds) AND EVT.USR_ID = :doctorId AND EVT.EVT_DELETE = 0',
        {
          conIds: conIds.join(','),
          doctorId,
        },
      );
      reliabilityQr.addGroupBy('EVT.CON_ID');

      const reliabilities: {
        reliability: number;
        conId: number;
      }[] = await reliabilityQr.getRawMany();

      const allContacts = contacts.map((contact) => {
        const reliability = reliabilities.find((r) => r?.conId === contact?.id);
        contact.reliability = 0;
        if (reliability) {
          contact.reliability = reliability.reliability;
        }
        return contact;
      });
      return allContacts;
    }
    return contacts;
  }

  /**
   * File: php/contact/recentlyTreated/findAll.php 14->77
   */
  async findAllRecentlyTreated(
    practitioner?: number,
  ): Promise<FindAllRecentlyTreatedRes[]> {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `
      CON.CON_ID as id,
      CON.CON_ID as DT_RowId,
      CON.CON_ID as value,
      CON.CON_NBR as nbr,
      CON.CON_LASTNAME as lastname,
      CON.CON_FIRSTNAME as firstname,
      CON.CON_BIRTHDAY as birthday,
      CON.CON_MSG as msg,
          CON.CON_COLOR as color,
      CONCAT_WS(' ', CON_LASTNAME, CON_FIRSTNAME) as label,
      GROUP_CONCAT(DISTINCT PHO.PHO_NBR) as phones,
      cou.cou_amount_due as amountDue,
      USR.USR_ID as practitionerId,
      USR.USR_ABBR as practitionerAbbr,
      USR.USR_LASTNAME as practitionerLastname,
      USR.USR_FIRSTNAME as practitionerFirstname`;

    const qr = queryBuiler
      .select(select)
      .addFrom((qb) => {
        return qb
          .select('ETK.CON_ID as id, ETK.ETK_ID as position')
          .from(EventTaskEntity, 'ETK')
          .where('ETK.USR_ID = :id', {
            id: practitioner,
          })
          .andWhere('ETK.ETK_DATE <= CURDATE()')
          .andWhere('ETK.CON_ID IS NOT NULL')
          .orderBy('ETK.ETK_DATE', 'DESC')
          .addOrderBy('ETK.ETK_ID', 'DESC')
          .limit(50);
      }, 'tmp')
      .innerJoin(ContactEntity, 'CON')
      .leftJoin(
        ContactUserEntity,
        'cou',
        'cou.con_id = CON.CON_ID AND cou.usr_id = :id',
        {
          id: practitioner,
        },
      )
      .leftJoin(UserEntity, 'USR', 'USR.USR_ID = CON.USR_ID')
      .leftJoin('T_CONTACT_PHONE_COP', 'COP', 'COP.CON_ID = CON.CON_ID')
      .leftJoin(PhoneEntity, 'PHO', 'PHO.PHO_ID = COP.PHO_ID')
      .where('tmp.id = CON.CON_ID')
      .andWhere('CON.deleted_at IS NULL')
      .groupBy('tmp.id')
      .orderBy('tmp.position', 'DESC');

    const results = await qr.getRawMany();

    /**
     * Logic in php/contact/recentlyTreated/findAll.php line 18->23, line 65->75
     */
    const conIds = results.map((a) => a.id);
    if (conIds && conIds.length > 0) {
      const reliabilityQueryBuilder = this.dataSource.createQueryBuilder();
      reliabilityQueryBuilder
        .select(
          `COALESCE(100 * SUM(IF(lateness = 0 AND EVT.EVT_STATE NOT IN (2, 3), 1, 0)) / COUNT(*), 0) as reliability,
          EVT.CON_ID as conId`,
        )
        .from(EventEntity, 'EVT')
        .where('EVT.CON_ID IN (:...conIds)')
        .andWhere('EVT.USR_ID = :usrId')
        .andWhere('EVT.EVT_DELETE = 0')
        .addGroupBy('EVT.CON_ID');

      // get reliabilities
      reliabilityQueryBuilder.setParameters({
        conIds: conIds,
        usrId: practitioner,
      });
      const reliabilities: {
        reliability: number;
        conId: number;
      }[] = await reliabilityQueryBuilder.getRawMany();

      // convert phones
      const pArr: Array<contactPhoneRes[]> = results.map((contact) => {
        return String(contact?.phones)
          .split(',')
          .map((item) => {
            return {
              nbr: item.trim(),
            };
          });
      });

      const recentlyTreatedArr = results.map((contact, index) => {
        // get reliability
        const reliability = reliabilities.find((r) => r?.conId === contact?.id);
        contact.reliability = 0;
        if (reliability) {
          contact.reliability = reliability?.reliability;
        }

        const tmp: FindAllRecentlyTreatedRes = {
          ...contact,
          phones: pArr[index],
        };
        return tmp;
      });

      return recentlyTreatedArr;
    }

    return results;
  }

  async getPatientInfoAgenda(
    contactId: number,
    practitionerId: number,
    groupId: number,
  ): Promise<FindRetrieveRes> {
    const result = await this.entityManager.findOne(ContactEntity, {
      where: { id: contactId },
      relations: [
        'gender',
        'user',
        'correspondent',
        'medecinTraitant',
        'address',
        'phones',
        'family',
        'upload',
      ],
    });

    const res: FindRetrieveRes = {
      id: result?.id || null,
      nbr: result?.nbr,
      lastname: result?.lastname,
      lastNamePhonetic: result?.lastNamePhonetic,
      firstname: result?.firstname,
      firstNamePhonetic: result?.firstNamePhonetic,
      profession: result?.profession,
      email: result?.email,
      birthday: result?.birthday,
      birthDateLunar: result?.birthDateLunar,
      birthOrder: result?.birthOrder,
      quality: result?.quality,
      breastfeeding: result?.breastfeeding,
      pregnancy: result?.pregnancy,
      clearanceCreatinine: result?.clearanceCreatinine,
      hepaticInsufficiency: result?.hepaticInsufficiency,
      weight: result?.weight,
      size: result?.size,
      conMedecinTraitantId: result?.conMedecinTraitantId,
      msg: result?.msg,
      odontogramObservation: result?.odontogramObservation,
      notificationMsg: result?.notificationMsg,
      notificationEnable: result?.notificationEnable,
      notificationEveryTime: result?.notificationEveryTime,
      color: result?.color,
      colorMedical: result?.colorMedical,
      insee: result?.insee,
      inseeKey: result?.inseeKey,
      socialSecurityReimbursementRate: result?.socialSecurityReimbursementRate,
      mutualRepaymentType: result?.mutualRepaymentType,
      mutualRepaymentRate: result?.mutualRepaymentRate,
      mutualComplement: result?.mutualComplement,
      mutualCeiling: result?.mutualCeiling,
      agenesie: result?.agenesie,
      maladieRare: result?.maladieRare,
      rxSidexisLoaded: result?.rxSidexisLoaded,
      externalReferenceId: result?.externalReferenceId,
      reminderVisitType: result?.reminderVisitType,
      reminderVisitDuration: result?.reminderVisitDuration,
      reminderVisitDate: result?.reminderVisitDate,
      reminderVisitLastDate: result?.reminderVisitLastDate,
      delete: result?.delete,
      organizationId: result?.organizationId,
      genId: result?.genId,
      adrId: result?.adrId,
      uplId: result?.uplId,
      cpdId: result?.cpdId,
      cofId: result?.cofId,
      ursId: result?.ursId,
      createdAt: null,
      updatedAt: null,
      deletedAt: null,
      gender: {
        id: result?.gender?.id,
        name: result?.gender?.name,
        longName: result?.gender?.longName,
        type: result?.gender?.type,
      },
      user: result?.user,
      address: result?.address,
      phones: result?.phones,
      family: result?.family,
      addressed_by: null,
      doctor: null,
      amountDue: null,
      reliability: null,
      avatarId: result?.upload?.id,
      avatarToken: result?.upload?.token,
    };
    if (result?.cpdId) {
      res.addressed_by = {
        id: result?.correspondent?.id,
        last_name: result?.correspondent?.lastName,
        first_name: result?.correspondent?.firstName,
      };
    }

    if (result?.medecinTraitant) {
      res['doctor'] = {
        id: result?.medecinTraitant?.id,
        last_name: result?.medecinTraitant?.lastName,
        first_name: result?.medecinTraitant?.firstName,
      };
    }

    const amountDue: [] = await this.dataSource.query(
      `
    SELECT IFNULL(cou_amount_due, 0)
    FROM contact_user_cou cou
    WHERE cou.con_id = ?
      AND cou.usr_id = ?`,
      [contactId, practitionerId],
    );
    res.amountDue = amountDue.length > 0 ? true : false;

    let output: {
      max: number;
      total: number;
      value: number;
      low: number;
      high: number;
    } = { max: 0, total: 0, value: 0, low: 0, high: 0 };

    const result2: {
      max: number;
      total: number;
      value: number;
      low: number;
      high: number;
    }[] = await this.dataSource.query(
      'SELECT COUNT(*) as `max`, COUNT(*) - SUM(IF(EVT.`EVT_STATE` IN (2, 3), 1, 0)) as `value`, ROUND((10 * COUNT(*)) / 100) as `low`, ROUND((50 * COUNT(*)) / 100) as `high` FROM `T_EVENT_EVT` EVT, `T_CONTACT_CON` CON WHERE EVT.`CON_ID` = CON.`CON_ID` AND EVT.`EVT_DELETE` = 0 AND CON.`CON_ID` = ? AND CON.`organization_id` = ? GROUP BY CON.`CON_ID`',
      [contactId, groupId],
    );

    if (result2.length > 0) {
      output = { ...output, ...result2[0] };
    }
    res.reliability = output;

    const convertDate = (date: Date) => {
      return {
        date: date,
        timezone_type: 3,
        timezone: 'UTC',
      };
    };

    if (result?.createdAt) {
      res.createdAt = convertDate(result?.createdAt);
    }
    if (result?.updatedAt) {
      res.updatedAt = convertDate(result?.updatedAt);
    }
    if (result?.deletedAt) {
      res.deletedAt = convertDate(result?.deletedAt);
    }

    return res;
  }
}
