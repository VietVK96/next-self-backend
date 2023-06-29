import { Injectable } from '@nestjs/common';
import { AddressEntity } from 'src/entities/address.entity';
import { DataSource, FindOneOptions, Repository } from 'typeorm';
import { SavePatientDto } from '../dto/save.patient.dto';
import { ContactEntity } from 'src/entities/contact.entity';
import { isNumber } from 'class-validator';
import { PatientMedicalEntity } from 'src/entities/patient-medical.entity';
import { PolicyHolderEntity } from 'src/entities/policy-holder.entity';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SaveContactService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(ContactEntity)
    private contactRepo: Repository<ContactEntity>,
  ) {}

  async savePatient(reqBody: SavePatientDto, organizationId: number) {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.startTransaction();
      const address: SavePatientDto = {
        addressId: reqBody.addressId,
        addressStreet: reqBody.addressStreet,
        addressStreetComp: reqBody.addressStreetComp,
        addressZipCode: reqBody.addressZipCode,
        addressCity: reqBody.addressCity,
        addressCountry: reqBody.addressCountry,
        addressCountryAbbr: reqBody.addressCountryAbbr,
      };

      const queryBuilder = this.dataSource.createQueryBuilder();

      if (
        address.addressStreet ||
        address.addressStreetComp ||
        address.addressZipCode ||
        address.addressCity ||
        address.addressCountry ||
        address.addressCountryAbbr
      ) {
        const queryInsertAdd = `INSERT INTO T_ADDRESS_ADR (ADR_ID, ADR_STREET, ADR_STREET_COMP, ADR_ZIP_CODE, ADR_CITY, ADR_COUNTRY, ADR_COUNTRY_ABBR)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE ADR_STREET = VALUES(ADR_STREET),
                                ADR_STREET_COMP = VALUES(ADR_STREET_COMP),
                                ADR_ZIP_CODE = VALUES(ADR_ZIP_CODE),
                                ADR_CITY = VALUES(ADR_CITY),
                                ADR_COUNTRY = VALUES(ADR_COUNTRY),
                                ADR_COUNTRY_ABBR = VALUES(ADR_COUNTRY_ABBR)`;
        const resultAddress = await this.dataSource.manager.query(
          queryInsertAdd,
          [
            address.addressId,
            address.addressStreet,
            address.addressStreetComp,
            address.addressZipCode,
            address.addressCity,
            address.addressCountry,
            address.addressCountryAbbr,
          ],
        );

        if (!address.addressId) {
          address.addressId = resultAddress.id;
        }
      } else if (reqBody?.id) {
        const selectAddressQuery = queryBuilder
          .select()
          .from(AddressEntity, 'ADR')
          .innerJoin(ContactEntity, 'CON')
          .where('CON.CON_ID = :id', { id: reqBody?.id })
          .andWhere('CON.ADR_ID = ADR.ADR_ID');
        const addresses: AddressEntity[] =
          await selectAddressQuery.getRawMany();
        const addessIds = addresses.map((a) => a?.id);

        const deleteAddressQuery = `
          DELETE ADR 
          FROM T_ADDRESS_ADR ADR 
          JOIN T_CONTACT_CON CON 
          WHERE CON.CON_ID = ? 
          AND CON.ADR_ID = ADR.ADR_ID`;
        await this.dataSource.query(deleteAddressQuery, [addessIds]);
      }

      if (!isNumber(reqBody.social_security_reimbursement_rate)) {
        reqBody.social_security_reimbursement_rate = null;
      }

      const patients: ContactEntity[] = reqBody.id
        ? await this.dataSource.manager.getRepository(ContactEntity).find({
            where: {
              id: reqBody?.id,
            },
            relations: {
              group: true,
              medical: true,
            },
          })
        : undefined;
      let patient = patients ? patients[0] : undefined;
      if (!patient) {
        patient = new ContactEntity();

        const options: FindOneOptions<OrganizationEntity> = {
          where: { id: organizationId },
        };
        patient.group = await this.dataSource
          .getRepository(OrganizationEntity)
          .findOneOrFail(options);
      }

      patient.nbr = reqBody.nbr;
      patient.lastname = reqBody.lastname;
      patient.firstname = reqBody.firstname;
      patient.birthOrder = reqBody.birthOrder;
      patient.insee = reqBody.insee;
      patient.inseeKey = reqBody.inseeKey;
      patient.odontogramObservation =
        reqBody.odontogram_observation?.trim() ?? null;

      let patientMedical: PatientMedicalEntity = patient.medical;
      if (!patientMedical) {
        patientMedical = new PatientMedicalEntity();
        patientMedical.patient = patient;
        patient.medical = patientMedical;
      }

      const policyHolderName = reqBody?.medical.policy_holder?.name;
      const policyHolderInseeNumber =
        reqBody?.medical?.policy_holder?.insee_number ?? null;
      const policyHolderPatientId =
        reqBody?.medical?.policy_holder?.patient?.id ?? null;
      let policyHolder = patientMedical?.policyHolder;

      if (!policyHolderName) {
        if (!policyHolder) {
          policyHolder = new PolicyHolderEntity();

          policyHolder.organization = patient.group;

          patientMedical.policyHolder = policyHolder;
        }

        if (policyHolderPatientId) {
          const options: FindOneOptions<ContactEntity> = {
            where: { id: policyHolderPatientId },
          };
          policyHolder.patient = await this.dataSource
            .getRepository(ContactEntity)
            .findOneOrFail(options);
        } else policyHolder.patient = null;
        policyHolder.name = policyHolderName;
        policyHolder.inseeNumber = policyHolderInseeNumber;
      } else if (policyHolder) {
        patientMedical.policyHolder = null;

        this.dataSource.createEntityManager().remove(policyHolder);
      }

      // const tariffId = reqBody.medical?.tariff_type?.id
      //   ? parseInt(reqBody.medical?.tariff_type?.id)
      //   : 0;

      // const options: FindOneOptions<TariffTypeEntity> = {
      //   where: { id: tariffId },
      // };
      // patientMedical['tariffType'] = await this.dataSource
      //   .getRepository(TariffTypeEntity)
      //   .findOneOrFail(options);

      await this.dataSource.manager.save(ContactEntity, patient);

      const inputParameters = [];
      inputParameters.push(reqBody.practitionerId);
      inputParameters.push(reqBody.genderId);
      inputParameters.push(reqBody.addressId);
      inputParameters.push(reqBody.avatarId);
      inputParameters.push(reqBody.addressed_by?.id ?? null);
      inputParameters.push(reqBody.contactFamilyId);
      inputParameters.push(reqBody.profession);
      inputParameters.push(reqBody.email);
      inputParameters.push(reqBody.birthday ?? null);
      inputParameters.push(reqBody.quality);
      inputParameters.push(reqBody.breastfeeding);
      inputParameters.push(reqBody.pregnancy);
      inputParameters.push(reqBody.clearanceCreatinine);
      inputParameters.push(reqBody.hepaticInsufficiency);
      inputParameters.push(reqBody.weight);
      inputParameters.push(reqBody.size);
      inputParameters.push(reqBody.doctor?.id ?? null); // array or object
      inputParameters.push(reqBody.msg);
      inputParameters.push(reqBody.notificationMsg);
      inputParameters.push(parseInt(reqBody.notification) !== 0);
      inputParameters.push(parseInt(reqBody.notification) === 2);
      inputParameters.push(reqBody.reminderVisitType);
      inputParameters.push(reqBody.reminderVisitDuration);
      inputParameters.push(reqBody.reminderVisitDate ?? null);
      inputParameters.push(reqBody.reminderVisitLastDate ?? null);
      inputParameters.push(reqBody.color);
      inputParameters.push(reqBody.colorMedical);
      inputParameters.push(reqBody.social_security_reimbursement_rate);
      inputParameters.push(reqBody.mutualRepaymentType);
      inputParameters.push(reqBody.mutualRepaymentRate);
      inputParameters.push(reqBody.mutualComplement);
      inputParameters.push(reqBody.mutualCeiling);
      inputParameters.push(reqBody.agenesie);
      inputParameters.push(reqBody.maladieRare);
      inputParameters.push(reqBody.rxSidexisLoaded);
      inputParameters.push(reqBody?.id);

      const updateContactQuery = `
      UPDATE T_CONTACT_CON
          SET USR_ID = ?,
              GEN_ID = ?,
              ADR_ID = ?,
              UPL_ID = ?,
              CPD_ID = ?,
              COF_ID = ?,
              CON_PROFESSION = ?,
              CON_MAIL = ?,
              CON_BIRTHDAY = ?,
              CON_QUALITY = ?,
              CON_BREASTFEEDING = ?,
              CON_PREGNANCY = ?,
              CON_CLEARANCE_CREATININE = ?,
              CON_HEPATIC_INSUFFICIENCY = ?,
              CON_WEIGHT = ?,
              CON_SIZE = ?,
              CON_MEDECIN_TRAITANT = ?,
              CON_MSG = ?,
              CON_NOTIFICATION_MSG = ?,
              CON_NOTIFICATION_ENABLE = ?,
              CON_NOTIFICATION_EVERY_TIME = ?,
              CON_REMINDER_VISIT_TYPE = ?,
              CON_REMINDER_VISIT_DURATION = ?,
              CON_REMINDER_VISIT_DATE = ?,
              CON_REMINDER_VISIT_LAST_DATE = ?,
              CON_COLOR = ?,
              CON_COLOR_MEDICAL = ?,
              social_security_reimbursement_rate = ?,
              CON_MUTUAL_REPAYMENT_TYPE = ?,
              CON_MUTUAL_REPAYMENT_RATE = ?,
              CON_MUTUAL_COMPLEMENT = ?,
              CON_MUTUAL_CEILING = ?,
              CON_AGENESIE = ?,
              CON_MALADIE_RARE = ?,
              CON_RX_SIDEXIS_LOADED = ?
          WHERE CON_ID = ?`;
      await this.dataSource.query(updateContactQuery, inputParameters);

      const phones = reqBody.phones || [];
      const phoneIds = [];
      phoneIds.push(0);

      for (const phone of phones) {
        let phoneId = phone.id ?? 0;
        const phoneNbr = phone?.nbr;
        const phoneTypeId = phone?.phoneTypeId;

        const queryInsertPhone = `INSERT INTO T_PHONE_PHO (PHO_ID, PTY_ID, PHO_NBR)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE PTY_ID = VALUES(PTY_ID),PHO_NBR = VALUES(PHO_NBR)`;

        const phoneUpdate = await this.dataSource.manager.query(
          queryInsertPhone,
          [phoneId, phoneTypeId, phoneNbr],
        );

        if (!phoneId) {
          phoneId = phoneUpdate.PHO_ID;
        }

        const queryInsertContactPhone = `INSERT IGNORE INTO T_CONTACT_PHONE_COP (PHO_ID, CON_ID) VALUES (?, ?)`;
        await this.dataSource.manager.query(queryInsertContactPhone, [
          phoneId,
          reqBody?.id,
        ]);
        phoneIds.push(phoneId);
      }

      const queryDeleteCopPho = `DELETE COP, PHO
                           FROM T_CONTACT_PHONE_COP COP,
                                T_PHONE_PHO PHO
                           WHERE COP.CON_ID = ?
                             AND COP.PHO_ID = PHO.PHO_ID
                             AND PHO.PHO_ID NOT IN (?)`;
      this.dataSource.manager.query(queryDeleteCopPho, [reqBody?.id, phoneIds]);

      await queryRunner.commitTransaction();

      return patient.id;
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        queryRunner.rollbackTransaction();
      }
      return error;
    }
  }
}
