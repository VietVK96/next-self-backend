import { Injectable } from '@nestjs/common';
import { ContactEntity } from 'src/entities/contact.entity';
import { DataSource } from 'typeorm';
import { FamilyContactDto } from '../dto/family.contact.dto';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ContactFamilyEntity } from 'src/entities/contact-family.entity';
import { ContactService } from './contact.service';

@Injectable()
export class FamilyService {
  constructor(
    private dataSource: DataSource,
    private contactService: ContactService,
  ) {}

  /**
   *File application/Services/Contact/Family.php
   *Line 10 -> 42
   */

  async getContactList(familyId: number, groupId: number) {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const patients = await queryBuiler
      .select(
        ` CON.CON_ID AS id,
        CON.CON_LASTNAME AS lastname,
        CON.CON_FIRSTNAME AS firstname`,
      )
      .from(ContactEntity, 'CON')
      .where(`CON.COF_ID = :familyId AND CON.organization_id = :groupId`, {
        familyId,
        groupId,
      })
      .orderBy('lastname, firstname')
      .execute();
    for (const patient of patients) {
      const amountDues = await this.contactService.getAmountDue(patient?.id);
      patient.amount_due = amountDues.amount_due;
      patient.amount_due_care = amountDues.amount_due_care;
      patient.amount_due_prosthesis = amountDues.amount_due_prosthesis;
    }
    return patients;
  }

  /**
   * File php/contact/family.php
   * Line 21 -> 197
   */

  async contactFamily(payload: FamilyContactDto, identity: UserIdentity) {
    const { id, action, target, contact } = payload;
    const groupId = identity.org;
    const queryBuiler = this.dataSource.createQueryBuilder();
    try {
      if (action === 'save') {
        if (!(Number.isInteger(id) && id >= 1)) {
          throw new CBadRequestException('invalid contact identifier');
        } else if (!(Number.isInteger(target) && id >= 1)) {
          throw new CBadRequestException('invalid target identifier');
        } else if (id === target) {
          throw new CBadRequestException(
            "Vous essayez d'ajouter le même patient",
          );
        }

        const contacts = new Map();
        const qr = queryBuiler
          .select('CON.`CON_ID` as `id`,IFNULL(CON.`COF_ID`, 0) as `family_id`')
          .from(ContactEntity, 'CON')
          .where('CON.`CON_ID` IN (:id, :target)', { id, target })
          .andWhere('CON.`organization_id` = :group', { group: groupId });
        const listContact = await qr.getRawMany();
        for (const contact of listContact) {
          contacts.set(contact?.id, contact?.family_id);
        }
        if (!(contacts.get(id) && contacts.get(target))) {
          throw new CBadRequestException('Aucun contact défini');
        }

        if (!!parseInt(contacts.get(id))) {
          if (!!parseInt(contacts.get(target))) {
            if (contacts.get(id) === contacts.get(target)) {
              throw new CBadRequestException(
                'Ce patient fait déjà parti de la famille',
              );
            } else {
              throw new CBadRequestException(
                "Ce contact fait déjà parti d'une autre famille",
              );
            }
          } else {
            await queryBuiler
              .update(ContactEntity)
              .set({ cofId: contacts.get(id) })
              .where('`CON_ID` = :target', { target })
              .execute();
            contacts.set(target, contacts.get(id));
          }
        } else if (!!parseInt(contacts.get(target))) {
          await queryBuiler
            .update(ContactEntity)
            .set({ cofId: contacts.get(id) })
            .where('`CON_ID` = :id', { id })
            .execute();
          contacts.set(id, contacts.get(target));
        } else {
          const newFamily = await queryBuiler
            .insert()
            .into(ContactFamilyEntity)
            .values({})
            .execute();
          const familyId = newFamily.raw?.insertId;
          contacts.set(id, familyId);
          contacts.set(target, familyId);
          await queryBuiler
            .update(ContactEntity)
            .set({ cofId: familyId })
            .where('`CON_ID` IN (:id, :target)', { id, target })
            .execute();
        }
        const family = await this.getContactList(contacts.get(id), groupId);
        return {
          data: {
            id: contacts.get(id),
            contacts: family,
          },
          message: '',
          status: 'success',
        };
      } else if (action === 'remove') {
        const contactId = contact;
        const row = await queryBuiler
          .select('CON.`COF_ID` as `family_id`')
          .from(ContactEntity, 'CON')
          .where(' CON.`CON_ID` = :contact', { contact: contactId })
          .andWhere('CON.`organization_id` = :group', { group: groupId })
          .getRawOne();
        if (row?.family_id) {
          const familyId = row?.family_id;
          await queryBuiler
            .update(ContactEntity)
            .set({ cofId: null })
            .where('`CON_ID` = :contact', { contact: contactId })
            .andWhere('`organization_id` = :group', { group: groupId })
            .execute();
          const contactFamilyStatement = await this.dataSource
            .getRepository(ContactEntity)
            .createQueryBuilder('CON')
            .where('CON.`COF_ID` = :cofId', { cofId: familyId })
            .andWhere('CON.`organization_id` = :organizationId', {
              organizationId: groupId,
            })
            .getCount();
          if (contactFamilyStatement <= 1) {
            await queryBuiler
              .update(ContactEntity)
              .set({ cofId: null })
              .where('`COF_ID` = :id', { id: familyId })
              .execute();
            await queryBuiler
              .delete()
              .from(ContactFamilyEntity)
              .where('`COF_ID` = :id', { id: familyId })
              .execute();
          }
          const family = await this.getContactList(familyId, groupId);
          return {
            data: {
              id: familyId,
              contacts: family,
            },
            message: '',
            status: 'success',
          };
        } else {
          throw new CBadRequestException('invalid contact identifier');
        }
      } else {
        throw new CBadRequestException('unknown action');
      }
    } catch (e) {
      throw new CBadRequestException(e?.response?.msg);
    }
  }
}
