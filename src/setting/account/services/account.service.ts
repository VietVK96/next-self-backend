import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FindAccountRes } from '../response/find.account.res';
import { UserEntity } from 'src/entities/user.entity';
import { SpecialtyCodeEntity } from 'src/entities/specialty-code.entity';
import { UpdateMyInformationDto } from '../dto/updateMyInformation.account.res';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { AddressEntity } from 'src/entities/address.entity';
import axios from 'axios';
import { ErrorCode } from 'src/constants/error';
import sharp from 'sharp';
import { SIGNATURE } from 'src/constants/users';
import { PrivilegeEntity } from 'src/entities/privilege.entity';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';
import { AmoEntity } from 'src/entities/amo.entity';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { de } from 'date-fns/locale';

@Injectable()
export class AccountService {
  constructor(private dataSource: DataSource) {}

  async find(userId: number): Promise<FindAccountRes> {
    const users = await this.dataSource.query(
      `
    SELECT
				T_USER_USR.USR_ID AS id,
				T_USER_USR.ADR_ID AS address_id,
				T_USER_USR.USR_ADMIN AS admin,
				T_USER_USR.USR_LOG AS login,
				T_USER_USR.USR_ABBR AS short_name,
				T_USER_USR.USR_LASTNAME AS lastname,
				T_USER_USR.USR_FIRSTNAME AS firstname,
                T_USER_USR.color,
				T_USER_USR.USR_MAIL AS email,
				T_USER_USR.USR_PHONE_NUMBER AS phone_home_number,
				T_USER_USR.USR_GSM AS phone_mobile_number,
				T_USER_USR.USR_FAX_NUMBER AS fax_number,
				T_USER_USR.USR_NUMERO_FACTURANT AS adeli,
				T_USER_USR.finess AS finess,
                T_USER_USR.USR_RATE_CHARGES AS taxes,
                social_security_reimbursement_base_rate,
                social_security_reimbursement_rate,
				T_USER_USR.USR_AGA_MEMBER AS aga_member,
				T_USER_USR.freelance,
				T_USER_USR.USR_DEPASSEMENT_PERMANENT AS droit_permanent_depassement,
				T_USER_USR.USR_SIGNATURE AS signature,
				T_USER_USR.USR_TOKEN AS token,
				T_USER_USR.USR_BCB_LICENSE AS bcbdexther_license,
				T_LICENSE_LIC.LIC_END AS end_of_license_at,
                T_USER_TYPE_UST.UST_PRO AS professional,
                T_USER_PREFERENCE_USP.signature_automatic,
                user_medical.rpps_number AS rpps_number
			FROM T_USER_USR
            JOIN T_USER_PREFERENCE_USP ON T_USER_PREFERENCE_USP.USR_ID = T_USER_USR.USR_ID
			LEFT OUTER JOIN T_LICENSE_LIC ON T_LICENSE_LIC.USR_ID = T_USER_USR.USR_ID AND T_USER_USR.USR_CLIENT = 0
			LEFT OUTER JOIN T_USER_TYPE_UST ON T_USER_TYPE_UST.UST_ID = T_USER_USR.UST_ID
			LEFT OUTER JOIN user_medical ON user_medical.user_id = T_USER_USR.USR_ID
			WHERE T_USER_USR.USR_ID = ?`,
      [userId],
    );

    const user = users.length > 0 ? users[0] : {};
    const address = await this.dataSource.query(
      `
      SELECT
                  T_ADDRESS_ADR.ADR_ID AS id,
                  T_ADDRESS_ADR.ADR_STREET AS street,
                  T_ADDRESS_ADR.ADR_STREET_COMP AS street_comp,
                  T_ADDRESS_ADR.ADR_ZIP_CODE AS zip_code,
                  T_ADDRESS_ADR.ADR_CITY AS city,
                  T_ADDRESS_ADR.ADR_COUNTRY AS country,
                  T_ADDRESS_ADR.ADR_COUNTRY_ABBR AS country_code
              FROM T_ADDRESS_ADR
              WHERE T_ADDRESS_ADR.ADR_ID = ?`,
      user.address_id,
    );
    user.address = address[0];
    delete user.address_id;

    const connections = await this.dataSource.query(
      `
    SELECT
				T_USER_CONNECTION_USC.USC_IP AS ip,
				T_USER_CONNECTION_USC.USC_SESSION_ID AS session_id,
				T_USER_CONNECTION_USC.USC_AGENT AS agent,
				T_USER_CONNECTION_USC.created_at
			FROM T_USER_CONNECTION_USC
			WHERE T_USER_CONNECTION_USC.USR_ID = ?
			ORDER BY T_USER_CONNECTION_USC.created_at DESC
			LIMIT 1`,
      [userId],
    );

    return {
      user,
      userConnection: connections.length > 0 ? connections[0] : {},
    };
  }

  async findMyInformation(userId: number): Promise<{
    user: UserEntity;
    specialtyCodes: SpecialtyCodeEntity[];
  }> {
    const user = await this.dataSource
      .getRepository(UserEntity)
      .findOneOrFail({ where: { id: userId } });
    const specialtyCodes = await this.dataSource
      .getRepository(SpecialtyCodeEntity)
      .find();
    return {
      user,
      specialtyCodes,
    };
  }

  async updateMyInformation(userId: number, payload: UpdateMyInformationDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.dataSource
        .getRepository(UserEntity)
        .findOneOrFail({
          where: { id: userId },
          relations: {
            address: true,
            privileged: true,
            medical: true,
            amo: true,
            preference: true,
          },
        });

      const street = payload.street;
      const zipCode = payload.zip_code;
      const city = payload.city;
      const countryAbbr = payload.countryAbbr;
      const userLogin = payload.log ? payload.log.trim() : null;
      const userGsm = payload.gsm;
      const userPhoneNumber = payload.phoneNumber;
      const userFaxNumber = payload.faxNumber;
      const userAgaMember = payload.agaMember;
      const droitPermanentDepassement = payload.droit_permanent_depassement;
      const userRateCharges = payload.rateCharges;
      let signature = payload.signature;
      const userFiness = payload.finess;

      if (!(await this.checkingLogin(userLogin, userId))) {
        throw new CBadRequestException(
          "Le nom d'utilisateur doit être unique et doit contenir au minimum 6 caractères de types alphanumériques, points (.), underscore (_), arobase (@) ou tiret (-).",
        );
      }

      if (street || zipCode || city || countryAbbr) {
        const address = user.address;
        if (address) {
          const countries = (
            await axios.get('https://restcountries.com/v3.1/all')
          ).data;

          address.street = street;
          address.zipCode = zipCode;
          address.city = city;
          address.country = countries[countryAbbr];
          address.countryAbbr = countryAbbr;

          await queryRunner.manager.save(AddressEntity, address);
          // await this.dataSource.getRepository(AddressEntity).save(address);
        }
      } else {
        await queryRunner.manager.delete(AddressEntity, user.adrId);
        // await this.dataSource
        //   .getRepository(AddressEntity)
        //   .delete({ id: user.adrId });
        delete user.adrId;
        delete user.address;
        if (signature) {
          const buffer = Buffer.from(signature, 'base64');
          sharp(buffer)
            .resize(SIGNATURE.HEIGHT, SIGNATURE.WIDTH)
            .toBuffer()
            .then((resizedBuffer) => {
              const resizedBase64 = resizedBuffer.toString('base64');
              signature = resizedBase64;
            });
        }
      }
      user.log = userLogin;
      user.gsm = userGsm;
      user.phoneNumber = userPhoneNumber;
      user.faxNumber = userFaxNumber;
      user.agaMember = !userAgaMember ? 1 : 0;
      user.droitPermanentDepassement = !droitPermanentDepassement ? 1 : 0;
      user.rateCharges = Number(userRateCharges);
      user.socialSecurityReimbursementBaseRate =
        payload.social_security_reimbursement_base_rate;
      user.socialSecurityReimbursementRate =
        payload.social_security_reimbursement_rate;
      user.signature = signature;
      user.finess = userFiness;

      const promises = [];
      if (user.privileged) {
        const newName = user.lastname.concat(' ', user.firstname);
        for (const privilegeModel of user.privileged) {
          promises.push(
            queryRunner.manager.update(
              PrivilegeEntity,
              { id: privilegeModel.id },
              { name: newName },
            ),
          );
        }
      }
      await Promise.all(promises);
      delete user.privileged;

      if (payload.short_name) user.abbr = payload.short_name;
      if (payload.email) user.email = payload.email;
      if (payload.company_name)
        user.companyName =
          payload.company_name.trim() !== ''
            ? payload.company_name.trim()
            : null;
      if (payload.freelance) user.freelance = payload.freelance;

      if (user.medical) {
        const medical = user.medical;
        medical.rppsNumber = payload?.medical?.rpps_number
          ? payload.medical.rpps_number
          : null;
        // await this.dataSource.getRepository(UserMedicalEntity).save(medical);
        // await queryRunner.manager.save(UserMedicalEntity, medical)
        delete user.medical;
      }

      if (user.amo) {
        const amo = user.amo;
        amo.codeConvention = payload?.amo?.code_convention
          ? payload.amo.code_convention
          : null;
        // await this.dataSource.getRepository(AmoEntity).save(amo);
        await queryRunner.manager.save(AmoEntity, amo);
        delete user.amo;
      }

      const preference = user.preference;
      preference.signatureAutomatic = payload.signature_automatic;
      await queryRunner.manager.save(UserPreferenceEntity, preference);
      delete user.preference;

      // @TODO validate
      // $violations = $container->get('validator')->validate($user);

      //   if ($violations->count()) {

      //       $session->getFlashBag()->add('error', (string) $violations);

      //       header('Location: ' . Request::server('PHP_SELF'));
      //       exit;

      //   }

      await queryRunner.manager.save(UserEntity, user);
      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      return new CBadRequestException(ErrorCode.SAVE_FAILED);
    } finally {
      await queryRunner.release();
    }
  }

  public async checkingLogin(subject: string, userId = 0) {
    if (/^[a-zA-Z0-9._@-]{6,31}$/.test(subject)) {
      const userEn = await this.dataSource.getRepository(UserEntity).findOneBy({
        log: subject,
      });
      if (!userEn || userEn.id == userId) return true;
    }
    return false;
  }
}
