import { Injectable } from '@nestjs/common';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { ErrorCode } from 'src/constants/error';
import { AddressEntity } from 'src/entities/address.entity';
import {
  ContactEntity,
  EnumContactReminderVisitType,
} from 'src/entities/contact.entity';
import { PatientMedicalEntity } from 'src/entities/patient-medical.entity';
import { PhoneEntity } from 'src/entities/phone.entity';
import { DataSource, InsertResult, Repository, UpdateResult } from 'typeorm';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ContactDetailDto } from '../dto/contact-detail.dto';
import { isNumber } from 'class-validator';
import { PolicyHolderEntity } from 'src/entities/policy-holder.entity';
import * as dayjs from 'dayjs';
import { ContactService } from './contact.service';
import { ContactDetailRes } from '../response/contact-detail.res';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactPhoneCopEntity } from 'src/entities/contact-phone-cop.entity';
@Injectable()
export class SaveUpdateContactService {
  constructor(
    @InjectRepository(PatientMedicalEntity)
    private readonly patientMedicalRepository: Repository<PatientMedicalEntity>,
    private dataSource: DataSource,
    private contactService: ContactService,
  ) {}
  async updateContact(
    reqBody: ContactDetailDto,
    identity: UserIdentity,
  ): Promise<ContactDetailRes> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const address: AddressEntity = {
        id: reqBody.addressId,
        street: reqBody.addressStreet,
        streetComp: reqBody.addressStreetComp,
        zipCode: reqBody.addressZipCode,
        city: reqBody.addressCity,
        country: reqBody.addressCountry,
        countryAbbr: reqBody.addressCountryAbbr,
      };
      if (
        address.street ||
        address.streetComp ||
        address.zipCode ||
        address.city ||
        address.country ||
        address.countryAbbr
      ) {
        await queryRunner.manager
          .createQueryBuilder()
          .update(AddressEntity)
          .set(address)
          .where({ id: address.id })
          .execute();
      } else {
        if (address.id) {
          await queryRunner.manager
            .createQueryBuilder()
            .delete()
            .from(AddressEntity)
            .where({ id: address.id })
            .execute();
        }
      }

      if (!isNumber(reqBody.social_security_reimbursement_rate)) {
        reqBody.social_security_reimbursement_rate = null;
      }

      const patient: ContactEntity = {
        id: reqBody.id,
        organizationId: identity.org,
        nbr: reqBody.nbr,
        lastname: reqBody.lastname,
        firstname: reqBody.firstname,
        birthOrder: reqBody.birthOrder,
        insee: reqBody.insee,
        inseeKey: reqBody.inseeKey,
        odontogramObservation: reqBody.odontogram_observation?.trim() ?? null,
        ursId: reqBody.practitionerId,
        genId: reqBody.genderId,
        adrId: address.id,
        uplId: reqBody.avatarId,
        cpdId: reqBody.addressed_by?.id ?? null,
        cofId: reqBody.contactFamilyId,
        profession: reqBody.profession,
        email: reqBody.email,
        birthday: dayjs(reqBody.birthday).isValid() ? reqBody.birthday : null,
        quality: +reqBody.quality,
        breastfeeding: reqBody.breastfeeding,
        pregnancy: reqBody.pregnancy ?? 0,
        clearanceCreatinine: reqBody.clearanceCreatinine ?? 0,
        hepaticInsufficiency: reqBody.hepaticInsufficiency,
        weight: reqBody.weight,
        size: reqBody.size,
        conMedecinTraitantId: reqBody?.doctor?.id ?? null,
        msg: reqBody.msg,
        notificationMsg: reqBody.notificationMsg,
        notificationEnable: reqBody.notificationEnable,
        notificationEveryTime: reqBody.notificationEveryTime,
        reminderVisitType:
          EnumContactReminderVisitType[reqBody.reminderVisitType.toUpperCase()],
        reminderVisitDuration: reqBody.reminderVisitDuration,
        reminderVisitDate: reqBody.reminderVisitDate ?? null,
        reminderVisitLastDate: reqBody.reminderVisitLastDate ?? null,
        color: reqBody.color,
        colorMedical: reqBody.colorMedical,
        socialSecurityReimbursementRate:
          reqBody.social_security_reimbursement_rate,
        mutualRepaymentType: reqBody.mutualRepaymentType ?? 1,
        mutualRepaymentRate: reqBody.mutualRepaymentRate ?? 0,
        mutualComplement: reqBody.mutualComplement ?? 0,
        mutualCeiling: reqBody.mutualCeiling ?? 0,
        agenesie: reqBody.agenesie,
        maladieRare: reqBody.maladieRare,
        rxSidexisLoaded: reqBody.rxSidexisLoaded,
      };

      await queryRunner.manager
        .createQueryBuilder()
        .update(ContactEntity)
        .set(patient)
        .where({ id: patient.id })
        .execute();

      const policyHolderName = reqBody?.medical.policy_holder?.name;
      const inseeNumber = reqBody?.medical?.policy_holder?.insee_number ?? null;
      const policyHolderPatientId =
        reqBody?.medical?.policy_holder?.patient?.id ?? null;

      const patientMedical = await this.patientMedicalRepository.findOneOrFail({
        where: { patientId: patient.id },
        relations: {
          policyHolder: true,
        },
      });

      // check if the requested policy holder name exists
      // exiting will update or insert a new policy holder
      if (policyHolderName) {
        let policyHolder = patientMedical.policyHolder;
        let resultQueryPolicyHolder: InsertResult | UpdateResult;

        // check policy holder exists in patientMedical
        // existing will update, otherwise insert new
        if (policyHolder) {
          policyHolder = {
            ...policyHolder,
            inseeNumber,
            name: policyHolderName,
            patientId: policyHolderPatientId,
          };
          resultQueryPolicyHolder = await queryRunner.manager
            .createQueryBuilder()
            .update(PolicyHolderEntity)
            .set(policyHolder)
            .where({ id: policyHolder.id })
            .execute();
        } else {
          policyHolder = {
            inseeNumber,
            name: policyHolderName,
            patientId: policyHolderPatientId,
          };
          resultQueryPolicyHolder = await queryRunner.manager
            .createQueryBuilder()
            .insert()
            .into(PolicyHolderEntity)
            .values(policyHolder)
            .execute();
          await queryRunner.manager
            .createQueryBuilder()
            .update(PatientMedicalEntity)
            .set({
              policyHolderId: resultQueryPolicyHolder.raw.id,
            })
            .where({ id: patientMedical.id })
            .execute();
        }
      } else {
        if (patientMedical.policyHolder) {
          await queryRunner.manager
            .createQueryBuilder()
            .update(PatientMedicalEntity)
            .set({
              policyHolderId: null,
            })
            .where({ patientId: patient.id })
            .execute();

          await queryRunner.manager
            .createQueryBuilder()
            .delete()
            .from(PolicyHolderEntity)
            .where({ id: patientMedical.policyHolderId })
            .execute();
        }
      }
      const phoneids: number[] = [0];
      Promise.all(
        reqBody.phones.map(async (phone) => {
          const qPhone = [phone.id, phone.phoneTypeId, phone.nbr];

          const q = `INSERT INTO T_PHONE_PHO (PHO_ID, PTY_ID, PHO_NBR)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE PTY_ID = VALUES(PTY_ID),
                                  PHO_NBR = VALUES(PHO_NBR)`;
          const result = await queryRunner.query(q, qPhone);
          phone.id = phone.id || result.insertId;
          phoneids.push(phone.id);
          const qUpdateContactPhone = `INSERT IGNORE INTO T_CONTACT_PHONE_COP (PHO_ID, CON_ID)
            VALUES (?, ?)`;
          await queryRunner.query(qUpdateContactPhone, [phone.id, patient.id]);
        }),
      );

      const q = `DELETE COP, PHO
        FROM T_CONTACT_PHONE_COP COP,
             T_PHONE_PHO PHO
        WHERE COP.CON_ID = ?
          AND COP.PHO_ID = PHO.PHO_ID
          AND PHO.PHO_ID NOT IN (?)`;
      await queryRunner.query(q, [patient.id, reqBody.phones.map((e) => e.id)]);

      await queryRunner.commitTransaction();
      return await this.contactService.findOne(
        patient.id,
        reqBody.practitionerId,
        identity,
      );
    } catch (err) {
      queryRunner.rollbackTransaction();
      throw new CBadRequestException(ErrorCode.INSERT_FAILED);
    } finally {
      await queryRunner.release();
    }
  }
  async saveContact(reqBody: ContactDetailDto, identity: UserIdentity) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const address: AddressEntity = {
        street: reqBody.addressStreet,
        streetComp: reqBody.addressStreetComp,
        zipCode: reqBody.addressZipCode,
        city: reqBody.addressCity,
        country: reqBody.addressCountry,
        countryAbbr: reqBody.addressCountryAbbr,
      };
      if (
        address.street ||
        address.streetComp ||
        address.zipCode ||
        address.city ||
        address.country ||
        address.countryAbbr
      ) {
        const resultAddress = await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into(AddressEntity)
          .values(address)
          .execute();
        address.id = resultAddress.raw.insertId;
      }

      if (!isNumber(reqBody.social_security_reimbursement_rate)) {
        reqBody.social_security_reimbursement_rate = null;
      }

      const patient: ContactEntity = {
        organizationId: identity.org,
        nbr: reqBody.nbr,
        lastname: reqBody.lastname,
        firstname: reqBody.firstname,
        birthOrder: reqBody.birthOrder,
        insee: reqBody.insee,
        inseeKey: reqBody.inseeKey,
        odontogramObservation: reqBody.odontogram_observation?.trim() ?? null,
        ursId: reqBody.practitionerId,
        genId: reqBody.genderId,
        adrId: address.id,
        uplId: reqBody.avatarId,
        cpdId: reqBody.addressed_by?.id ?? null,
        cofId: reqBody.contactFamilyId,
        profession: reqBody.profession,
        email: reqBody.email,
        birthDate: dayjs(reqBody.birthday).isValid() ? reqBody.birthday : null,
        quality: +reqBody.quality,
        breastfeeding: reqBody.breastfeeding,
        pregnancy: reqBody.pregnancy ?? 0,
        clearanceCreatinine: reqBody.clearanceCreatinine ?? 0,
        hepaticInsufficiency: reqBody.hepaticInsufficiency,
        weight: reqBody.weight,
        size: reqBody.size,
        conMedecinTraitantId: reqBody.doctor.id ?? null,
        msg: reqBody.msg,
        notificationMsg: reqBody.notificationMsg,
        notificationEnable: reqBody.notificationEnable,
        notificationEveryTime: reqBody.notificationEveryTime,
        reminderVisitType:
          EnumContactReminderVisitType[reqBody.reminderVisitType.toUpperCase()],
        reminderVisitDuration: reqBody.reminderVisitDuration,
        reminderVisitDate: reqBody.reminderVisitDate ?? null,
        reminderVisitLastDate: reqBody.reminderVisitLastDate ?? null,
        color: reqBody.color,
        colorMedical: reqBody.colorMedical,
        socialSecurityReimbursementRate:
          reqBody.social_security_reimbursement_rate,
        mutualRepaymentType: reqBody.mutualRepaymentType ?? 1,
        mutualRepaymentRate: reqBody.mutualRepaymentRate ?? 0,
        mutualComplement: reqBody.mutualComplement ?? 0,
        mutualCeiling: reqBody.mutualCeiling ?? 0,
        agenesie: reqBody.agenesie,
        maladieRare: reqBody.maladieRare,
        rxSidexisLoaded: reqBody.rxSidexisLoaded,
      };

      const savePatient = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(ContactEntity)
        .values(patient)
        .execute();

      const policyHolderName = reqBody?.medical.policy_holder?.name;
      const inseeNumber = reqBody?.medical?.policy_holder?.insee_number ?? null;
      const policyHolderPatientId =
        reqBody?.medical?.policy_holder?.patient?.id ?? null;
      if (policyHolderName) {
        const policyHolder: PolicyHolderEntity = {
          inseeNumber,
          name: policyHolderName,
          patientId: policyHolderPatientId,
        };
        const savedPolicyHolder = await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into(PolicyHolderEntity)
          .values(policyHolder)
          .execute();
        await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into(PatientMedicalEntity)
          .values({
            patientId: savePatient.raw.id,
            policyHolderId: savedPolicyHolder.raw.id,
          })
          .execute();
      } else {
        await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into(PatientMedicalEntity)
          .values({
            patientId: savePatient.raw.insertId,
          })
          .execute();
      }

      if (reqBody?.phones) {
        const phones: PhoneEntity[] = reqBody.phones.map((e) => {
          return {
            nbr: e.nbr,
            ptyId: e.phoneTypeId,
          };
        });
        const insertPhoneResult = await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into(PhoneEntity)
          .values(phones)
          .execute();

        const contactPhones = insertPhoneResult.identifiers.map(
          (identifier) => {
            return {
              id: identifier.id,
              conId: patient.id,
            };
          },
        );

        await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into(ContactPhoneCopEntity)
          .values(contactPhones)
          .execute();
      }
      await queryRunner.commitTransaction();
      return await this.contactService.findOne(
        patient.id,
        reqBody.practitionerId,
        identity,
      );
    } catch (err) {
      queryRunner.rollbackTransaction();
      throw new CBadRequestException(ErrorCode.INSERT_FAILED);
    } finally {
      await queryRunner.release();
    }
  }
}