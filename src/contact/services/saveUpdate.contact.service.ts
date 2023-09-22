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
import { PolicyHolderEntity } from 'src/entities/policy-holder.entity';
import { ContactService } from './contact.service';
import { ContactDetailRes } from '../response/contact-detail.res';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactPhoneCopEntity } from 'src/entities/contact-phone-cop.entity';
import { checkId, checkNumber } from 'src/common/util/number';
import { checkDay } from 'src/common/util/day';
import { checkEmpty } from 'src/common/util/string';
@Injectable()
export class SaveUpdateContactService {
  constructor(
    @InjectRepository(PatientMedicalEntity)
    private readonly patientMedicalRepository: Repository<PatientMedicalEntity>,
    @InjectRepository(ContactEntity)
    private readonly contactRepo: Repository<ContactEntity>,
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
        id: reqBody?.addressId,
        street: reqBody?.addressStreet,
        streetComp: reqBody?.addressStreetComp,
        zipCode: reqBody?.addressZipCode,
        city: reqBody?.addressCity,
        country: reqBody?.addressCountry,
        countryAbbr: reqBody?.addressCountryAbbr,
      };
      if (
        address?.street ||
        address?.streetComp ||
        address?.zipCode ||
        address?.city ||
        address?.country ||
        address?.countryAbbr
      ) {
        if (address?.id) {
          await queryRunner.manager
            .createQueryBuilder()
            .update(AddressEntity)
            .set(address)
            .where({ id: address?.id })
            .execute();
        } else {
          delete address.id;
          await queryRunner.manager
            .createQueryBuilder()
            .insert()
            .into(AddressEntity)
            .values(address)
            .execute();
        }
      } else {
        if (address?.id) {
          await queryRunner.manager
            .createQueryBuilder()
            .delete()
            .from(AddressEntity)
            .where({ id: address?.id })
            .execute();
        }
      }

      if (
        reqBody?.social_security_reimbursement_rate &&
        isNaN(Number(reqBody?.social_security_reimbursement_rate))
      ) {
        reqBody.social_security_reimbursement_rate = null;
      }

      const medical = await this.patientMedicalRepository.findOne({
        where: {
          patientId: reqBody.id,
        },
      });

      let medicalUpdate: PatientMedicalEntity = {};
      if (medical) {
        medicalUpdate = {
          ...medical,
          tariffTypeId: reqBody.medical.tariffTypeId,
        };
      } else {
        medicalUpdate = {
          ...medical,
          patientId: reqBody.id,
          tariffTypeId: reqBody.medical.tariffTypeId,
        };
      }
      await this.patientMedicalRepository.save(medicalUpdate);

      const patient: ContactEntity = {
        id: reqBody?.id,
        organizationId: identity.org,
        nbr: checkNumber(reqBody?.nbr),
        lastname: reqBody?.lastname || '',
        firstname: reqBody?.firstname || '',
        birthOrder: checkNumber(reqBody?.birthOrder) || 1,
        insee: reqBody?.insee || null,
        inseeKey: reqBody?.inseeKey || null,
        odontogramObservation: reqBody?.odontogram_observation?.trim() || null,
        ursId: checkId(reqBody?.practitionerId),
        genId: Number(reqBody?.genderId) || null,
        adrId: address.id,
        uplId: checkId(reqBody?.avatarId),
        cpdId: checkId(reqBody?.addressed_by_id),
        cofId: checkId(reqBody?.contactFamilyId),
        profession: reqBody?.profession || null,
        email: reqBody?.email || null,
        birthday: checkDay(reqBody.birthday),
        quality: checkNumber(reqBody.quality),
        breastfeeding: checkNumber(reqBody?.breastfeeding) || 0,
        pregnancy: checkNumber(reqBody?.pregnancy) || 0,
        clearanceCreatinine: checkNumber(reqBody?.clearanceCreatinine) || 0,
        hepaticInsufficiency: reqBody?.hepaticInsufficiency || '',
        weight: checkNumber(reqBody?.weight) || 0,
        size: checkNumber(reqBody?.size) || 0,
        conMedecinTraitantId: checkId(reqBody?.doctor_id),
        msg: reqBody?.msg || null,
        notificationMsg: reqBody?.notificationMsg || null,
        notificationEnable: checkNumber(reqBody?.notificationEnable) || 0,
        notificationEveryTime: checkNumber(reqBody?.notificationEveryTime) || 0,
        reminderVisitType:
          EnumContactReminderVisitType[
            reqBody.reminderVisitType.toUpperCase()
          ] || EnumContactReminderVisitType.DURATION,
        reminderVisitDuration: checkNumber(reqBody?.reminderVisitDuration),
        reminderVisitDate: reqBody?.reminderVisitDate || null,
        reminderVisitLastDate: reqBody?.reminderVisitLastDate || null,
        color: checkNumber(reqBody?.color) || -3840,
        colorMedical: checkNumber(reqBody?.colorMedical) || -3840,
        socialSecurityReimbursementRate: checkNumber(
          reqBody?.social_security_reimbursement_rate,
        ),
        mutualRepaymentType: checkNumber(reqBody?.mutualRepaymentType) || 1,
        mutualRepaymentRate: checkNumber(reqBody?.mutualRepaymentRate) || 0,
        mutualComplement: checkNumber(reqBody?.mutualComplement) || 0,
        mutualCeiling: checkNumber(reqBody?.mutualCeiling) || 0,
        agenesie: checkNumber(reqBody?.agenesie) || 0,
        maladieRare: checkNumber(reqBody?.maladieRare) || 0,
        rxSidexisLoaded: checkNumber(reqBody?.rxSidexisLoaded) || 0,
      };

      await queryRunner.manager
        .createQueryBuilder()
        .update(ContactEntity)
        .set(patient)
        .where({ id: patient?.id })
        .execute();

      const policyHolderName = reqBody?.medical?.policy_holder?.name || null;
      const inseeNumber = reqBody?.medical?.policy_holder?.insee_number || null;
      const policyHolderPatientId =
        reqBody?.medical?.policy_holder?.patient?.id || null;

      const patientMedical = await this.patientMedicalRepository.findOne({
        where: { patientId: patient?.id || 0 },
        relations: {
          policyHolder: true,
        },
      });

      // check if the requested policy holder name exists
      // exiting will update or insert a new policy holder
      if (!checkEmpty(policyHolderName)) {
        let policyHolder = patientMedical?.policyHolder;
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
            .where({ id: policyHolder?.id })
            .execute();
        } else {
          policyHolder = {
            organizationId: identity.org,
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
          if (patientMedical?.id) {
            await queryRunner.manager
              .createQueryBuilder()
              .update(PatientMedicalEntity)
              .set({
                policyHolderId: resultQueryPolicyHolder?.raw?.insertId,
              })
              .where({ id: patientMedical.id })
              .execute();
          } else {
            await queryRunner.manager
              .createQueryBuilder()
              .insert()
              .into(PatientMedicalEntity)
              .values({
                patientId: patient?.id,
                policyHolderId: resultQueryPolicyHolder?.raw?.insertId,
              })
              .execute();
          }
        }
      } else {
        if (patientMedical?.policyHolder || patientMedical?.policyHolderId) {
          await queryRunner.manager
            .createQueryBuilder()
            .update(PatientMedicalEntity)
            .set({
              policyHolderId: null,
            })
            .where({ patientId: patient?.id })
            .execute();

          await queryRunner.manager
            .createQueryBuilder()
            .delete()
            .from(PolicyHolderEntity)
            .where({ id: patientMedical?.policyHolderId })
            .execute();
        }
      }
      const phoneids: number[] = [0];
      Promise.all(
        reqBody?.phones.map(async (phone) => {
          const qPhone = [phone.id, phone.phoneTypeId, phone.nbr];

          const q = `INSERT INTO T_PHONE_PHO (PHO_ID, PTY_ID, PHO_NBR)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE PTY_ID = VALUES(PTY_ID),
                                  PHO_NBR = VALUES(PHO_NBR)`;
          const result = await queryRunner.query(q, qPhone);
          phone.id = phone?.id || result?.insertId;
          phoneids.push(phone.id);
          const qUpdateContactPhone = `INSERT IGNORE INTO T_CONTACT_PHONE_COP (PHO_ID, CON_ID)
            VALUES (?, ?)`;
          await queryRunner.query(qUpdateContactPhone, [
            phone?.id,
            patient?.id,
          ]);
        }),
      );

      const q = `DELETE COP, PHO
        FROM T_CONTACT_PHONE_COP COP,
             T_PHONE_PHO PHO
        WHERE COP.CON_ID = ?
          AND COP.PHO_ID = PHO.PHO_ID
          AND PHO.PHO_ID NOT IN (?)`;
      await queryRunner.query(q, [
        patient.id,
        reqBody?.phones.map((e) => e.id).join(),
      ]);

      await queryRunner.commitTransaction();
      return await this.contactService.findOne(
        patient.id,
        reqBody?.practitionerId,
        identity,
      );
    } catch (err) {
      await queryRunner.rollbackTransaction();
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
        street: reqBody?.addressStreet,
        streetComp: reqBody?.addressStreetComp,
        zipCode: reqBody?.addressZipCode,
        city: reqBody?.addressCity,
        country: reqBody?.addressCountry,
        countryAbbr: reqBody?.addressCountryAbbr,
      };
      if (
        address?.street ||
        address?.streetComp ||
        address?.zipCode ||
        address?.city ||
        address?.country ||
        address?.countryAbbr
      ) {
        const resultAddress = await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into(AddressEntity)
          .values(address)
          .execute();
        address.id = resultAddress?.raw?.insertId;
      }

      if (
        reqBody?.social_security_reimbursement_rate &&
        isNaN(Number(reqBody?.social_security_reimbursement_rate))
      ) {
        reqBody.social_security_reimbursement_rate = null;
      }

      const patient: ContactEntity = {
        organizationId: identity.org,
        nbr: checkNumber(reqBody?.nbr),
        lastname: reqBody?.lastname || '',
        firstname: reqBody?.firstname || '',
        birthOrder: checkNumber(reqBody?.birthOrder) || 1,
        insee: reqBody?.insee || null,
        inseeKey: reqBody?.inseeKey || null,
        odontogramObservation: reqBody?.odontogram_observation?.trim() || null,
        ursId: checkId(reqBody?.practitionerId),
        genId: Number(reqBody?.genderId) || null,
        adrId: address.id,
        uplId: checkId(reqBody?.avatarId),
        cpdId: checkId(reqBody?.addressed_by_id),
        cofId: checkId(reqBody?.contactFamilyId),
        profession: reqBody?.profession || null,
        email: reqBody?.email || null,
        birthday: checkDay(reqBody.birthday),
        quality: checkNumber(reqBody.quality),
        breastfeeding: checkNumber(reqBody?.breastfeeding) || 0,
        pregnancy: checkNumber(reqBody?.pregnancy) || 0,
        clearanceCreatinine: checkNumber(reqBody?.clearanceCreatinine) || 0,
        hepaticInsufficiency: reqBody?.hepaticInsufficiency || '',
        weight: checkNumber(reqBody?.weight) || 0,
        size: checkNumber(reqBody?.size) || 0,
        conMedecinTraitantId: checkId(reqBody?.doctor.id),
        msg: reqBody?.msg || null,
        notificationMsg: reqBody?.notificationMsg || null,
        notificationEnable: checkNumber(reqBody?.notificationEnable) || 1,
        notificationEveryTime: checkNumber(reqBody?.notificationEveryTime) || 0,
        reminderVisitType:
          EnumContactReminderVisitType[
            reqBody.reminderVisitType.toUpperCase()
          ] || EnumContactReminderVisitType.DURATION,
        reminderVisitDuration: checkNumber(reqBody?.reminderVisitDuration),
        reminderVisitDate: reqBody?.reminderVisitDate || null,
        reminderVisitLastDate: reqBody?.reminderVisitLastDate || null,
        color: checkNumber(reqBody?.color) || -3840,
        colorMedical: checkNumber(reqBody?.colorMedical) || -3840,
        socialSecurityReimbursementRate: checkNumber(
          reqBody?.social_security_reimbursement_rate,
        ),
        mutualRepaymentType: checkNumber(reqBody?.mutualRepaymentType) || 1,
        mutualRepaymentRate: checkNumber(reqBody?.mutualRepaymentRate) || 0,
        mutualComplement: checkNumber(reqBody?.mutualComplement) || 0,
        mutualCeiling: checkNumber(reqBody?.mutualCeiling) || 0,
        agenesie: checkNumber(reqBody?.agenesie) || 0,
        maladieRare: checkNumber(reqBody?.maladieRare) || 0,
        rxSidexisLoaded: checkNumber(reqBody?.rxSidexisLoaded) || 0,
      };
      const savePatient = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(ContactEntity)
        .values(patient)
        .execute();
      await queryRunner.manager
        .createQueryBuilder()
        .update(ContactEntity)
        .set({ nbr: savePatient.raw.insertId })
        .where('id = :id', { id: savePatient.raw.insertId })
        .execute();

      const policyHolderName = reqBody?.medical.policy_holder?.name || '';
      const inseeNumber = reqBody?.medical?.policy_holder?.insee_number || null;
      const policyHolderPatientId = checkId(
        reqBody?.medical?.policy_holder?.patient?.id,
      );

      const policyHolder: PolicyHolderEntity = {
        organizationId: identity.org,
        inseeNumber,
      };
      if (!checkEmpty(policyHolderPatientId)) {
        policyHolder.patientId = policyHolderPatientId;
      } else if (!checkEmpty(policyHolderName)) {
        policyHolder.name = policyHolderName;
      }

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
          patientId: savePatient?.raw?.insertId,
          policyHolderId: savedPolicyHolder?.raw?.insertId,
          tariffTypeId: reqBody?.medical?.tariffTypeId,
        })
        .execute();

      if (reqBody?.phones) {
        const phones: PhoneEntity[] = reqBody?.phones?.map((e) => {
          return {
            nbr: e?.nbr,
            ptyId: e?.phoneTypeId,
          };
        });
        const insertPhoneResult = await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into(PhoneEntity)
          .values(phones)
          .execute();

        const contactPhones = insertPhoneResult?.identifiers?.map(
          (identifier) => {
            return {
              id: identifier?.id,
              conId: patient?.id,
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
        patient?.id,
        reqBody?.practitionerId,
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
