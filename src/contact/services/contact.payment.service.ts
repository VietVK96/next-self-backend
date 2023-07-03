import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import {
  ContactPaymentFindAllDto,
  ContactPaymentStoreDto,
} from '../dto/contact.payment.dto';
import { CashingEntity } from 'src/entities/cashing.entity';
import { CashingContactEntity } from 'src/entities/cashing-contact.entity';
import { UserEntity } from 'src/entities/user.entity';
import { ContactEntity } from 'src/entities/contact.entity';
import { SlipCheckEntity } from 'src/entities/slip-check.entity';
import { ContactPaymentFindAllRes } from '../response/contact.payment.res';
import { InjectRepository } from '@nestjs/typeorm';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { PermissionService } from 'src/user/services/permission.service';

@Injectable()
export class ContactPaymentService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(CashingEntity)
    private readonly repo: Repository<CashingEntity>,
    @InjectRepository(CashingContactEntity)
    private readonly cashingContactRepo: Repository<CashingContactEntity>,
    private permissionService: PermissionService,
  ) {}

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

  /**
   * php/payment/delete.php
   * 21->53
   */
  async deleteById(id: number, identity: UserIdentity) {
    try {
      const payment = await this.repo.find({
        where: {
          id,
        },
        relations: {
          payees: true,
        },
      });
      // check permission
      if (payment.length) {
        // TODO permission not working
        if (
          !this.permissionService.hasPermission(
            'PERMISSION_PAIEMENT',
            8,
            identity.id,
            payment[0].usrId,
          ) ||
          !this.permissionService.hasPermission(
            'PERMISSION_DELETE',
            8,
            identity.id,
          )
        ) {
          throw new CBadRequestException('Permission denied');
        }

        // TODO Create Log
        //  $payees = $payment->getPayees();
        //   foreach ($payees as $payee) {
        //     Ids\Log::write('Paiement', $payee->getPatient()->getId(), 3);
        // }
        if (payment[0].payees) {
          const payeesId = payment[0].payees.map((e) => e.id);
          this.cashingContactRepo.delete(payeesId);
        }
        await this.repo.delete({ id });
        return;
      }
    } catch (error) {
      throw new CBadRequestException(error);
    }
  }

  async store(payload: ContactPaymentStoreDto) {
    const data = this.refundAmount(payload);
  }

  protected refundAmount(
    inputs: ContactPaymentStoreDto,
  ): ContactPaymentStoreDto {
    if (inputs.hasOwnProperty('type') && inputs.type === 'remboursement') {
      function walkRecursive(obj) {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            if (key.match(/^amount/)) {
              obj[key] = -Math.abs(obj[key]);
            }
            if (typeof obj[key] === 'object') {
              walkRecursive(obj[key]);
            }
          }
        }
      }
      walkRecursive(inputs);
    }
    return inputs;
  }
}
