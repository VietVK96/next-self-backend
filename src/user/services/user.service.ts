import { BadRequestException, Injectable } from '@nestjs/common';
import { AddressService } from 'src/address/service/address.service';
import { LicenseEntity } from 'src/entities/license.entity';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { UserTypeEntity } from 'src/entities/user-type.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { UpdateTherapeuticDto } from '../dto/therapeutic.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { UserSmsEntity } from 'src/entities/user-sms.entity';
import { ErrorCode } from 'src/constants/error';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import * as crypto from 'crypto';
import * as phpPassword from 'node-php-password';
import { SuccessResponse } from 'src/common/response/success.res';
import { UpdatePassWordSettingDto } from '../dto/user-setting.dto';
@Injectable()
export class UserService {
  constructor(
    private addressService: AddressService,
    private dataSource: DataSource,
    @InjectRepository(UserMedicalEntity)
    private userMedicalRepository: Repository<UserMedicalEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  // application/Services/User.php 153 -> 207
  async find(id: number) {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `
    USR.USR_ID AS id,
    USR.ADR_ID AS address_id,
    USR.USR_ADMIN AS admin,
    USR.USR_LOG AS login,
    USR.USR_ABBR AS short_name,
    USR.USR_LASTNAME AS lastname,
    USR.USR_FIRSTNAME AS firstname,
    USR.color,
    USR.USR_MAIL AS email,
    USR.USR_PHONE_NUMBER AS phone_home_number,
    USR.USR_GSM AS phone_mobile_number,
    USR.USR_FAX_NUMBER AS fax_number,
    USR.USR_NUMERO_FACTURANT AS adeli,
    USR.finess AS finess,
    USR.USR_RATE_CHARGES AS taxes,
    social_security_reimbursement_base_rate,
    social_security_reimbursement_rate,
    USR.USR_AGA_MEMBER AS aga_member,
    USR.freelance,
    USR.USR_DEPASSEMENT_PERMANENT AS droit_permanent_depassement,
    USR.USR_SIGNATURE AS signature,
    USR.USR_TOKEN AS token,
    USR.USR_BCB_LICENSE AS bcbdexther_license,
    LIC.LIC_END AS end_of_license_at,
    UST.UST_PRO AS professional,
    USP.signature_automatic,
    UMD.rpps_number AS rpps_number`;

    const q = queryBuiler
      .select(select)
      .from(UserEntity, 'USR')
      .innerJoin(UserPreferenceEntity, 'USP', 'USP.USR_ID = USR.USR_ID')
      .leftJoin(
        LicenseEntity,
        'LIC',
        'LIC.USR_ID = USR.USR_ID AND USR.USR_CLIENT = 0',
      )
      .leftJoin(UserTypeEntity, 'UST', 'UST.UST_ID = USR.UST_ID')
      .leftJoin(UserMedicalEntity, 'UMD', 'UMD.user_id = USR.USR_ID')
      .where('USR.USR_ID = :id', { id });
    const user = await q.getRawOne();
    const address = await this.addressService.find(user.address_id);
    return {
      ...user,
      address: {
        ...address,
      },
    };
  }

  async updateUserMedical(id: number, payload: UpdateTherapeuticDto) {
    const datas = await this.userMedicalRepository.find({
      where: { userId: id },
    });
    const ids = datas.map((user) => ({
      ...user,
      therapeuticAlternative: JSON.stringify(payload?.therapeutic_alternative),
    }));
    await this.userMedicalRepository.save(ids);
    return ids;
  }

  async getSmsQuantity(id: number) {
    const queryBuilder = this.dataSource.createQueryBuilder();
    const select = `
      SUM(
        CASE WHEN organization.smsSharing = true
        THEN sms.USS_STOCK
        ELSE (
            CASE WHEN user.id = ${id}
            THEN sms.USS_STOCK
            ELSE 0
            END
        )
        END
      )`;
    return await queryBuilder
      .select(select, 'smsQuantity')
      .from(UserEntity, 'user')
      .innerJoin(
        OrganizationEntity,
        'organization',
        'organization.id = user.organization_id',
      )
      .innerJoin(UserSmsEntity, 'sms', 'sms.USR_ID = user.id')
      .getRawOne();
  }

  async getTherapeutic(id: number) {
    try {
      const datas = await this.userMedicalRepository.findOne({
        where: { userId: id },
      });

      const therapeutic = datas.therapeuticAlternative;
      return {
        therapeutic_alternative: therapeutic,
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async getPasswordAccounting(id: number) {
    try {
      const userFind = await this.userRepository.findOneOrFail({
        where: { id: id },
      });
      if (userFind) return { userFind };
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async createPasswordAccounting(
    id: number,
    updatePassWordSettingDto: UpdatePassWordSettingDto,
  ): Promise<SuccessResponse> {
    try {
      const userFind = await this.userRepository.findOneOrFail({
        where: { id: id },
      });

      const { password, confirmation_password } = updatePassWordSettingDto;

      if (password !== confirmation_password) {
        throw new CBadRequestException(ErrorCode.INVALID_PASSWORD);
      }

      const newPassword = phpPassword.hash(password);
      userFind.passwordAccounting = newPassword;
      await this.userRepository.save(userFind);

      return {
        success: true,
      };
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async updatePasswordAccounting(
    id: number,
    updatePassWordSettingDto: UpdatePassWordSettingDto,
  ): Promise<SuccessResponse> {
    try {
      const userFind = await this.userRepository.findOneOrFail({
        where: { id: id },
      });
      const { old_password, password, confirmation_password } =
        updatePassWordSettingDto;

      if (!userFind.passwordAccounting) {
        const shasum = crypto.createHash('sha1');
        const passwordHash = shasum.update(old_password).digest('hex');

        if (passwordHash !== userFind.passwordAccounting) {
          throw new CBadRequestException(ErrorCode.INVALID_PASSWORD);
        }

        if (password !== confirmation_password) {
          throw new CBadRequestException(ErrorCode.INVALID_PASSWORD);
        }

        const newPassword = phpPassword.hash(password);
        userFind.passwordAccounting = newPassword;
        await this.userRepository.save(userFind);
        return { success: true };
      } else {
        if (!phpPassword.verify(old_password, userFind.passwordAccounting)) {
          throw new CBadRequestException(ErrorCode.CAN_NOT_LOGIN);
        }
        if (
          phpPassword.needsRehash(password, 'PASSWORD_DEFAULT', { cost: 10 })
        ) {
          if (password !== confirmation_password) {
            throw new CBadRequestException(ErrorCode.INVALID_PASSWORD);
          }

          const newPassword = phpPassword.hash(password);
          userFind.passwordAccounting = newPassword;
          await this.userRepository.save(userFind);
          return { success: true };
        }
      }
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async deletePasswordAccounting(
    id: number,
    updatePassWordSettingDto: UpdatePassWordSettingDto,
  ): Promise<SuccessResponse> {
    try {
      const userFind = await this.userRepository.findOneOrFail({
        where: { id: id },
      });

      const { password } = updatePassWordSettingDto;

      if (!userFind.passwordAccounting) {
        const shasum = crypto.createHash('sha1');
        const passwordHash = shasum.update(password).digest('hex');
        if (passwordHash !== userFind.passwordAccounting) {
          throw new CBadRequestException(ErrorCode.INVALID_PASSWORD);
        }

        const newPassword = null;
        userFind.passwordAccounting = newPassword;
        await this.userRepository.save(userFind);
        return {
          success: true,
        };
      } else {
        if (!phpPassword.verify(password, userFind.passwordAccounting)) {
          throw new CBadRequestException(ErrorCode.CAN_NOT_LOGIN);
        }
        if (
          phpPassword.needsRehash(password, 'PASSWORD_DEFAULT', { cost: 10 })
        ) {
          const newPassword = null;
          userFind.passwordAccounting = newPassword;
          await this.userRepository.save(userFind);
          return {
            success: true,
          };
        }
      }
    } catch (err) {
      throw new BadRequestException(err);
    }
  }
}
