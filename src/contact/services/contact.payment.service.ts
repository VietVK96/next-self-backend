import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import {
  contactPhoneRes,
  FindAllRecentlyTreatedRes,
} from '../response/findall.recentlyTreated.res';
import { ContactPaymentFindAllDto } from '../dto/contact.payment.dto';
import { CashingEntity } from 'src/entities/cashing.entity';
import { CashingContactEntity } from 'src/entities/cashing-contact.entity';
import { UserEntity } from 'src/entities/user.entity';
import { ContactEntity } from 'src/entities/contact.entity';
import { SlipCheckEntity } from 'src/entities/slip-check.entity';
import { ContactPaymentFindAllRes } from '../response/contact.payment.res';

@Injectable()
export class ContactPaymentService {
  constructor(private dataSource: DataSource) {}

  /**
   * File: php\contact\payment\findAll.php 13->62
   */
  async findAll(
    request?: ContactPaymentFindAllDto,
  ): Promise<ContactPaymentFindAllRes[]> {
    const select = `
      csg.CSG_ID AS id,
      csg.CSG_PAYMENT AS payment,
      csg.CSG_PAYMENT_DATE AS paymentDate,
      csg.CSG_TYPE AS TYPE,
      csg.is_tp,
      csc.amount_care,
      csc.amount_prosthesis,
      csc.CSC_AMOUNT as amount,
      csg.CSG_MSG as msg,
      IF (con.CON_ID IS NOT NULL, CONCAT_WS(' ', con.CON_LASTNAME, con.CON_FIRSTNAME), csg.CSG_DEBTOR) as debtor,
      usr.USR_ID AS practitionerId,
      usr.USR_ABBR AS practitionerAbbr,
      usr.USR_LASTNAME AS practitionerLastname,
      usr.USR_FIRSTNAME AS practitionerFirstname,
      slc.SLC_ID AS bordereau_id,
      slc.SLC_NBR AS bordereau_number`;
    const cashes = await this.dataSource
      .createQueryBuilder()
      .select(select)
      .from(CashingEntity, 'csg')
      .innerJoin(CashingContactEntity, 'csc')
      .innerJoin(UserEntity, 'usr')
      .leftJoin(ContactEntity, 'con', 'con.CON_ID = csg.CON_ID')
      .leftJoin(SlipCheckEntity, 'slc', 'slc.SLC_ID = csg.SLC_ID')
      .where('csg.CSG_ID = csc.CSG_ID')
      .andWhere('csc.CON_ID = :id', { id: request?.id })
      .andWhere('csg.USR_ID = usr.USR_ID')
      .getRawMany();
    for (const cash of cashes) {
      cash.bordereau = null;
      if (cash.bordereau_id) {
        cash.bordereau = {
          id: cash.bordereau_id,
          number: cash.bordereau_number,
        };
      }
      delete cash.bordereau_id;
      delete cash.bordereau_number;
    }
    return cashes;
  }
}
