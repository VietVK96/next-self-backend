import { BadRequestException, Injectable } from '@nestjs/common';
import { AddressService } from 'src/address/service/address.service';
import { LicenseEntity } from 'src/entities/license.entity';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { UserTypeEntity } from 'src/entities/user-type.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource, Not, Repository } from 'typeorm';
import { UpdateTherapeuticDto } from '../dto/therapeutic.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { UserSmsEntity } from 'src/entities/user-sms.entity';
import { AccountStatusEnum } from 'src/enum/account-status.enum';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { GetOneActiveRes } from '../res/get-active.res';
import { PrivilegeEntity } from 'src/entities/privilege.entity';
import { SuccessResponse } from 'src/common/response/success.res';
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

  private async _findAllPermissions(id: number) {
    const stmQuery = `
    SELECT
      T_USER_USR.USR_PERMISSION_LIBRARY AS library,
              T_USER_USR.USR_PERMISSION_PATIENT AS patient,
              T_USER_USR.permission_patient_view AS patient_view,
      T_USER_USR.USR_PERMISSION_PASSWORD AS password,
      T_USER_USR.USR_PERMISSION_DELETE AS permissionDelete
    FROM T_USER_USR
    WHERE T_USER_USR.USR_ID = ?`;

    const permissions = await this.dataSource.query(stmQuery, [id]);
    const currentPermisson = permissions[0];

    const doctorStmQuery = `
    SELECT
      T_PRIVILEGE_PVG.PVG_ID AS id,
      T_PRIVILEGE_PVG.USR_WITH_ID AS user_id,
      T_PRIVILEGE_PVG.PVG_NAME AS name,
      T_PRIVILEGE_PVG.PVG_ENABLE AS active,
      T_PRIVILEGE_PVG.PVG_PERMISSION_BILLING AS invoice,
      T_PRIVILEGE_PVG.PVG_PERMISSION_PAIEMENT AS payment,
      T_PRIVILEGE_PVG.PVG_PERMISSION_ACCOUNTING AS accountancy
    FROM T_PRIVILEGE_PVG
    WHERE T_PRIVILEGE_PVG.USR_ID = ?`;

    const doctorsRes = await this.dataSource.query(doctorStmQuery, [id]);
    const permissionDoctor = [];
    for (const dc of doctorsRes) {
      const userFind = await this.find(dc?.user_id);
      permissionDoctor.push({
        ...userFind,
        permissionDoctor: dc,
      });
    }
    return {
      current: currentPermisson,
      doctors: permissionDoctor,
    };
  }

  private async _getPractitioners(organizationId: number) {
    const user = await this.userRepository.find({
      where: {
        client: Not(AccountStatusEnum.TERMINATED),
        organizationId,
      },
      relations: {
        medical: true,
      },
      order: {
        lastname: 'ASC',
        firstname: 'ASC',
      },
    });

    return user.map(({ id, medical, firstname, lastname }) => {
      if (medical) {
        return { id, firstname, lastname };
      }
    });
  }

  async getActiveUser(organizationId: number) {
    const listUser = await this.userRepository.find({
      where: { client: Not(AccountStatusEnum.TERMINATED), organizationId },
      relations: { medical: true },
      order: { lastname: 'ASC', firstname: 'ASC' },
    });
    const result = listUser.map(
      ({ id, admin, lastname, firstname, medical }) => {
        return {
          id,
          admin,
          lastname,
          firstname,
          medical,
        };
      },
    );
    return result;
  }

  async getOneActiveUser(
    loginUserId: number,
    queryId: number,
    organizationId: number,
  ): Promise<GetOneActiveRes> {
    if (!queryId) throw new CBadRequestException(ErrorCode.FORBIDDEN);

    const userData = await this.userRepository.findOne({
      where: { id: queryId },
    });
    const practitioners = await this._getPractitioners(organizationId);

    if (!userData) throw new CBadRequestException(ErrorCode.NOT_FOUND);

    const userFrom = await this.find(loginUserId);
    const userTo = await this.find(queryId);
    const permission = await this._findAllPermissions(userTo?.id);

    if (!(userFrom?.admin || userFrom?.id === userTo?.id)) {
      throw new CBadRequestException(ErrorCode.CANNOT_EDIT_USER);
    }
    const doctors = permission.doctors;
    practitioners.forEach((prac, indexP) => {
      doctors.forEach((doc) => {
        if (prac?.id === doc?.id) {
          practitioners[indexP]['permission'] = doc.permissionDoctor;
        }
      });
    });
    const { id, lastname, firstname, color } = userTo;
    return {
      user: {
        id,
        lastname,
        firstname,
        color,
        permission: permission.current,
      },
      doctors: practitioners,
    };
  }

  async updateActiveUser(
    loginUserId: number,
    queryId: number,
    organizationId: number,
    body: GetOneActiveRes,
  ): Promise<SuccessResponse> {
    if (!queryId || !loginUserId || organizationId) {
      throw new CBadRequestException(ErrorCode.FORBIDDEN);
    }
    const user = await this.userRepository.findOne({ where: { id: queryId } });
    if (!user) throw new CBadRequestException(ErrorCode.NOT_FOUND);
    const transaction = this.dataSource.createQueryRunner();
    try {
      const { firstname, lastname, color, permission } = body.user;

      const permissionLibrary = permission.library;
      const permissionPatient = permission.patient;
      const permissionPatientView = permission.patient_view;
      const permissionPassword = permission.password;
      const permissionDelete = permission.permissionDelete;
      const doctors = body.doctors;

      await transaction.connect();
      await transaction.startTransaction();

      const userEntity = await this.userRepository.findOne({
        where: { id: loginUserId },
      });

      if (!userEntity) {
        throw new CBadRequestException(ErrorCode.NOT_FOUND);
      }

      const userAdmin = userEntity?.admin;

      const targetUserEntity: UserEntity = await this.dataSource
        .getRepository(UserEntity)
        .createQueryBuilder('usr')
        .innerJoin('usr.type', 'ust')
        .leftJoin('usr.address', 'adr')
        .leftJoin('usr.privileges', 'pvg')
        .addSelect('ust')
        .addSelect('adr')
        .addSelect('pvg')
        .where('usr.id = :userId', { userId: user?.id })
        .andWhere('usr.organizationId = :groupId', { groupId: organizationId })
        .getOne();

      if (!targetUserEntity) {
        throw new CBadRequestException(ErrorCode.NOT_FOUND);
      }
      const targetUserTypeEntity = targetUserEntity.type;

      let privilegeTargetEntity: PrivilegeEntity;
      if (userEntity?.id && targetUserEntity?.id) {
        privilegeTargetEntity = await this.dataSource
          .getRepository(PrivilegeEntity)
          .findOne({
            where: {
              usrId: userEntity?.id,
              usrWithId: targetUserEntity?.id,
            },
          });
      }

      if (targetUserTypeEntity.professional) {
        if (!privilegeTargetEntity) {
          privilegeTargetEntity = new PrivilegeEntity();
          privilegeTargetEntity.user = userEntity;
          privilegeTargetEntity.userWith = targetUserEntity;
          privilegeTargetEntity.enable = 0;
        }

        privilegeTargetEntity.name = lastname + ' ' + firstname;
        await this.dataSource
          .getRepository(PrivilegeEntity)
          .save(privilegeTargetEntity);
      }

      targetUserEntity.color = color;
      await this.userRepository.save(targetUserEntity);

      if (userAdmin) {
        targetUserEntity.permissionLibrary = permissionLibrary;
        targetUserEntity.permissionPatient = permissionPatient;
        targetUserEntity.permissionPatientView = permissionPatientView;
        targetUserEntity.permissionPassword = permissionPassword;
        targetUserEntity.permissionDelete = permissionDelete;
        await this.userRepository.save(targetUserEntity);

        if (doctors && doctors.length > 0) {
          for (const doc of doctors) {
            const practitionerId = doc?.id;
            const permission = doc?.permission;
            const enable = permission?.active ? permission?.active : 0;
            const permissionBilling = permission?.invoice;
            const permissionPaiement = permission?.payment;
            const permissionAccounting = permission?.accountancy;
            let privilegeProfessionalEntity: PrivilegeEntity;
            if (userEntity?.id && practitionerId) {
              privilegeProfessionalEntity = await this.dataSource
                .getRepository(PrivilegeEntity)
                .findOne({
                  where: {
                    usrId: userEntity?.id,
                    usrWithId: practitionerId,
                  },
                });
            }

            if (!privilegeProfessionalEntity) {
              const practitionerEntity = await this.userRepository.findOne({
                where: { id: practitionerId },
              });
              if (!practitionerEntity)
                throw new CBadRequestException(ErrorCode.NOT_FOUND);
              privilegeProfessionalEntity = new PrivilegeEntity();
              privilegeProfessionalEntity.user = targetUserEntity;
              privilegeProfessionalEntity.userWith = practitionerEntity;
              privilegeProfessionalEntity.name =
                practitionerEntity.lastname +
                ' ' +
                practitionerEntity.firstname;
            }

            privilegeProfessionalEntity.permissionBilling = permissionBilling;
            privilegeProfessionalEntity.permissionPaiement = permissionPaiement;
            privilegeProfessionalEntity.permissionAccounting =
              permissionAccounting;
            privilegeProfessionalEntity.enable = enable;

            await this.dataSource
              .getRepository(PrivilegeEntity)
              .save(privilegeProfessionalEntity);
          }
        }

        await transaction.commitTransaction();
        return {
          success: true,
        };
      }
    } catch (error) {
      await transaction.rollbackTransaction();
      throw new CBadRequestException(error?.message);
    }
  }
}
