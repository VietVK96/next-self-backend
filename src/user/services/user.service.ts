import { Injectable } from '@nestjs/common';
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
import * as crypto from 'crypto';
import * as phpPassword from 'node-php-password';
import { SuccessResponse } from 'src/common/response/success.res';
import { UpdatePassWordSettingDto } from '../dto/user-setting.dto';
import { AccountStatusEnum } from 'src/enum/account-status.enum';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { GetOneActiveRes } from '../res/get-active.res';
import { PrivilegeEntity } from 'src/entities/privilege.entity';
import { EventTypeEntity } from 'src/entities/event-type.entity';
import { AppointmentReminderLibraryEntity } from 'src/entities/appointment-reminder-library.entity';
import { checkId } from 'src/common/util/number';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { UpdateUserSmsDto } from '../dto/user-sms.dto';
import { AddressEntity } from 'src/entities/address.entity';
import { UserPreferenceQuotationEntity } from 'src/entities/user-preference-quotation.entity';
import { UserConnectionEntity } from 'src/entities/user-connection.entity';
import { UserResourceEntity } from 'src/entities/user-resource.entity';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserMedicalEntity)
    private userMedicalRepository: Repository<UserMedicalEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private addressService: AddressService,
    private dataSource: DataSource,
  ) {}

  // application/Services/User.php 153 -> 207
  async find(id: number) {
    id = checkId(id);
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
      .where('USR.USR_ID = :id', { id: id || 0 });
    const user = await q.getRawOne();
    if (!user?.id) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND_USER);
    }
    const address = await this.addressService.find(user?.address_id);

    // for get eventType and reminders when create appointment
    const eventTypes = await this.dataSource.manager.find(EventTypeEntity, {
      where: {
        userId: user?.id,
      },
    });
    const preferences = await this.dataSource.manager.findOne(
      UserPreferenceEntity,
      { where: { usrId: user?.id } },
    );
    const appointmentReminderLibraries = await this.dataSource.manager.find(
      AppointmentReminderLibraryEntity,
      {
        where: {
          usrId: user.id,
        },
        relations: {
          addressee: true,
          category: true,
          timelimitUnit: true,
        },
        select: {
          id: true,
          timelimit: true,
          addressee: { id: true },
          category: { id: true },
          timelimitUnit: { id: true },
        },
      },
    );
    return {
      ...user,
      address: {
        ...address,
      },
      preferences,
      eventTypes,
      appointmentReminderLibraries,
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
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async getPasswordAccounting(id: number) {
    try {
      const userFind = await this.userRepository.findOneOrFail({
        where: { id: id },
      });
      if (userFind) return { userFind };
    } catch (err) {
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async createPasswordAccounting(
    id: number,
    updatePassWordSettingDto: UpdatePassWordSettingDto,
  ): Promise<SuccessResponse> {
    const userFind = await this.userRepository.findOneOrFail({
      where: { id: id },
    });

    const { password, confirmation_password } = updatePassWordSettingDto;

    if (password !== confirmation_password) {
      throw new CBadRequestException(ErrorCode.CONFIRM_PASSWORD_NOT_CORRECT);
    }
    const newPassword = phpPassword.hash(password);
    userFind.passwordAccounting = newPassword;
    await this.userRepository.save(userFind);

    return {
      success: true,
    };
  }

  async updatePasswordAccounting(
    id: number,
    updatePassWordSettingDto: UpdatePassWordSettingDto,
  ): Promise<SuccessResponse> {
    const userFind = await this.userRepository.findOneOrFail({
      where: { id: id },
    });
    const { old_password, password, confirmation_password } =
      updatePassWordSettingDto;

    if (!userFind.passwordAccounting) {
      const shasum = crypto.createHash('sha1');
      const passwordHash = shasum.update(old_password).digest('hex');

      if (passwordHash !== userFind.passwordAccounting) {
        throw new CBadRequestException(ErrorCode.INVALID_ACCOUNTING_PASSWORD);
      }

      if (password !== confirmation_password) {
        throw new CBadRequestException(ErrorCode.CONFIRM_PASSWORD_NOT_CORRECT);
      }

      const newPassword = phpPassword.hash(password);
      userFind.passwordAccounting = newPassword;
      await this.userRepository.save(userFind);
      return { success: true };
    } else {
      if (!phpPassword.verify(old_password, userFind.passwordAccounting)) {
        throw new CBadRequestException(ErrorCode.INVALID_ACCOUNTING_PASSWORD);
      }
      if (phpPassword.needsRehash(password, 'PASSWORD_DEFAULT', { cost: 10 })) {
        if (password !== confirmation_password) {
          throw new CBadRequestException(
            ErrorCode.CONFIRM_PASSWORD_NOT_CORRECT,
          );
        }

        const newPassword = phpPassword.hash(password);
        userFind.passwordAccounting = newPassword;
        await this.userRepository.save(userFind);
        return { success: true };
      }
    }
  }

  async deletePasswordAccounting(
    id: number,
    updatePassWordSettingDto: UpdatePassWordSettingDto,
  ): Promise<SuccessResponse> {
    const userFind = await this.userRepository.findOneOrFail({
      where: { id: id },
    });
    const { password } = updatePassWordSettingDto;
    if (!userFind.passwordAccounting) {
      const shasum = crypto.createHash('sha1');
      const passwordHash = shasum.update(password).digest('hex');
      if (passwordHash !== userFind.passwordAccounting) {
        throw new CBadRequestException(ErrorCode.INVALID_ACCOUNTING_PASSWORD);
      }
      const newPassword = null;
      userFind.passwordAccounting = newPassword;
      await this.userRepository.save(userFind);
      return {
        success: true,
      };
    } else {
      if (!phpPassword.verify(password, userFind.passwordAccounting)) {
        throw new CBadRequestException(ErrorCode.INVALID_ACCOUNTING_PASSWORD);
      }
      if (phpPassword.needsRehash(password, 'PASSWORD_DEFAULT', { cost: 10 })) {
        const newPassword = null;
        userFind.passwordAccounting = newPassword;
        await this.userRepository.save(userFind);
        return {
          success: true,
        };
      }
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

    return user.reduce((listUser, { id, medical, firstname, lastname }) => {
      if (medical) {
        return [...listUser, { id, firstname, lastname }];
      }
      return listUser;
    }, []);
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

    try {
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
    } catch (err) {
      console.log('🚀 ~ file: user.service.ts:428 ~ UserService ~ err:', err);
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async updateActiveUser(
    loginUserId: number,
    queryId: number,
    organizationId: number,
    body: GetOneActiveRes,
  ): Promise<SuccessResponse> {
    if (!queryId || !loginUserId || !organizationId) {
      throw new CBadRequestException(ErrorCode.FORBIDDEN);
    }
    const user = await this.userRepository.findOne({ where: { id: queryId } });
    if (!user) throw new CBadRequestException(ErrorCode.NOT_FOUND);
    const transaction = this.dataSource.createQueryRunner();
    try {
      await transaction.connect();
      await transaction.startTransaction();
      const { firstname, lastname, color, permission } = body?.user;

      const permissionLibrary = permission.library;
      const permissionPatient = permission.patient;
      const permissionPatientView = permission.patient_view;
      const permissionPassword = permission.password;
      const permissionDelete = permission.permissionDelete;
      const doctors = body.doctors;

      const userEntity = await transaction.manager
        .getRepository(UserEntity)
        .findOne({
          where: { id: loginUserId },
        });

      if (!userEntity) {
        throw new CBadRequestException(ErrorCode.NOT_FOUND);
      }

      const userAdmin = userEntity?.admin;

      const targetUserEntity: UserEntity = await transaction.manager
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
        privilegeTargetEntity = await transaction.manager
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
        await transaction.manager
          .getRepository(PrivilegeEntity)
          .save(privilegeTargetEntity);
      }

      targetUserEntity.color = color;
      await transaction.manager
        .getRepository(UserEntity)
        .save(targetUserEntity);

      if (userAdmin) {
        targetUserEntity.permissionLibrary = permissionLibrary;
        targetUserEntity.permissionPatient = permissionPatient;
        targetUserEntity.permissionPatientView = permissionPatientView;
        targetUserEntity.permissionPassword = permissionPassword;
        targetUserEntity.permissionDelete = permissionDelete;
        await transaction.manager
          .getRepository(UserEntity)
          .save(targetUserEntity);

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
              privilegeProfessionalEntity = await transaction.manager
                .getRepository(PrivilegeEntity)
                .findOne({
                  where: {
                    usrId: targetUserEntity?.id,
                    usrWithId: practitionerId,
                  },
                });
            }

            if (!privilegeProfessionalEntity) {
              const practitionerEntity = await transaction.manager
                .getRepository(UserEntity)
                .findOne({
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
            await transaction.manager
              .getRepository(PrivilegeEntity)
              .save(privilegeProfessionalEntity);
          }
        }
      }
      await transaction.commitTransaction();
      return {
        success: true,
      };
    } catch (error) {
      await transaction.rollbackTransaction();
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async add(user: any): Promise<any> {
    return Promise.resolve().then(() => {
      console.log('user added:', user);
    });
  }

  async createAcc() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      for (let n = 0; n <= 1500; n++) {
        const savedAddress = await queryRunner.manager
          .getRepository(AddressEntity)
          .insert({
            street: '78, impasse Caroline Allard',
            streetComp: null,
            zipCode: '10577',
            city: 'Neveu',
            country: 'France',
            countryAbbr: 'FR',
          });

        const savedUser = await queryRunner.manager
          .getRepository(UserEntity)
          .insert({
            socialSecurityReimbursementBaseRate: '100.00',
            socialSecurityReimbursementRate: '70.00',
            resourceId: 1,
            avatarId: null,
            admin: 1,
            log: `Testtt${n}`,
            passwordAccounting: null,
            password:
              '$2y$10$jldzVAQH5pG2R5uSqMiP0uHVE.VJ2u2ghErBEKpfOGlw8m2R3CHda',
            passwordHash: 1,
            email: 'support@ecoodentist.com',
            validated: '1995-06-18',
            abbr: 'ROU',
            lastname: 'ROULETTE',
            firstname: 'Paul',
            color: -25344,
            gsm: '+33 7 38 17 34 83',
            phoneNumber: '+33 (0)1 84 15 76 55',
            faxNumber: '03 53 03 05 33',
            companyName: null,
            permissionLibrary: 15,
            permissionPatient: 15,
            permissionPatientView: 1,
            permissionPassword: 15,
            permissionDelete: 15,
            agaMember: 0,
            freelance: 0,
            droitPermanentDepassement: 1,
            numeroFacturant: '994003143',
            finess: '514040351',
            fluxCps: null,
            rateCharges: '84.16',
            bcbLicense: '999999998',
            settings: {
              eventTitleFormat: [
                [
                  'startTime',
                  'civilityTitle',
                  'lastName',
                  'firstName',
                  'title',
                ],
              ],
              activateSendingAppointmentReminders: true,
            },
            signature: null,
            pendingDeletion: 0,
            client: 1,
            token: crypto.randomUUID(),
            archivedAt: null,
            adrId: savedAddress.raw.insertId,
            organizationId: 1,
            ustId: 1,
            deletedAt: null,
            sms: null,
          });

        await queryRunner.manager.getRepository(LicenseEntity).insert({
          start: '2023-05-29',
          end: '2032-12-31',
          usrId: savedUser.raw.insertId,
        });

        await queryRunner.manager.getRepository(UserPreferenceEntity).insert({
          usrId: savedUser.raw.insertId,
          language: 'fr',
          country: 'FR',
          timezone: 'Europe/Paris',
          currency: 'EUR',
          view: 'week',
          days: 62,
          weekStartDay: 1,
          displayHoliday: 0,
          displayEventTime: 0,
          displayLastPatients: 1,
          displayPractitionerCalendar: 0,
          enableEventPractitionerChange: 1,
          frequency: 30,
          hmd: '08:00',
          hmf: '12:00',
          had: '14:00',
          haf: '20:00',
          heightLine: 0,
          quotationDisplayOdontogram: 'none',
          quotationDisplayDetails: 'both',
          quotationDisplayTooltip: 1,
          quotationDisplayDuplicata: 0,
          quotationColor: null,
          billDisplayTooltip: 1,
          billTemplate: 1,
          orderDisplayTooltip: 1,
          orderDuplicata: 1,
          orderPreprintedHeader: 0,
          orderPreprintedHeaderSize: 35,
          orderFormat: 'A4',
          orderBcbCheck: 1,
          themeCustom: 0,
          themeColor: null,
          themeBgcolor: null,
          themeBordercolor: null,
          themeAsideBgcolor: null,
          reminderVisitDuration: 6,
          ccamBridgeQuickentry: 0,
          priceGrid: 13,
          patientCareTime: '00:00:00',
          sesamVitaleModeDesynchronise: 0,
          calendarBorderColored: 1,
          signatureAutomatic: 0,
        });

        await queryRunner.manager
          .getRepository(UserPreferenceQuotationEntity)
          .insert({
            usrId: savedUser.raw.insertId,
            color: null,
            periodOfValidity: 6,
            placeOfManufacture: 1,
            placeOfManufactureLabel: null,
            withSubcontracting: 1,
            placeOfSubcontracting: null,
            placeOfSubcontractingLabel: null,
            displayOdontogram: 'none',
            displayAnnexe: 'both',
            displayNotice: 1,
            displayTooltip: 1,
            displayDuplicata: 1,
            treatmentTimeline: 0,
          });

        await queryRunner.manager
          .getRepository(AppointmentReminderLibraryEntity)
          .insert({
            usrId: savedUser.raw.insertId,
            rmrId: 1,
            RMTID: 1,
            rmuId: 1,
            timelimit: 1,
            attachmentCount: 0,
          });

        await queryRunner.manager.getRepository(PrivilegeEntity).insert([
          {
            name: 'ROULETTE Paul',
            color: -12303,
            type: 'all',
            pos: 0,
            enable: 1,
            permissionCalendar: 15,
            permissionBilling: 15,
            permissionPaiement: 15,
            permissionAccounting: 15,
            usrId: savedUser.raw.insertId,
            usrWithId: savedUser.raw.insertId,
          },
          {
            name: 'DENTISTE RPPS-ADELI Géraldine',
            color: -12303,
            type: 'all',
            pos: 0,
            enable: 1,
            permissionCalendar: 15,
            permissionBilling: 15,
            permissionPaiement: 15,
            permissionAccounting: 15,
            usrId: savedUser.raw.insertId,
            usrWithId: 2,
          },
          {
            name: 'ROULETTE Paul',
            color: -12303,
            type: 'all',
            pos: 0,
            enable: 1,
            permissionCalendar: 15,
            permissionBilling: 15,
            permissionPaiement: 15,
            permissionAccounting: 15,
            usrId: 2,
            usrWithId: savedUser.raw.insertId,
          },
        ]);

        await queryRunner.manager.getRepository(UserConnectionEntity).insert({
          usrId: savedUser.raw.insertId,
          sessionId: 'p3uo7rsrqt2q4vaoeaso38ljcs',
          ipAddress: '10.10.31.92',
          httpUserAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.57',
          USC_FROM_GSM: 0,
        });

        await queryRunner.manager.getRepository(UserResourceEntity).insert([
          {
            usrId: savedUser.raw.insertId,
            resourceId: 1,
          },
        ]);
      }

      await queryRunner.commitTransaction();
      return 'a';
    } catch (err) {
      console.log('loi', err);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(user: UserIdentity) {
    const users = await this.userRepository.find({
      where: {
        organizationId: user.org,
      },
      relations: {
        sms: true,
      },
    });
    return users?.map((user) => {
      return {
        id: user?.id,
        fullName: `${user?.lastname} ${user?.firstname}`,
        sms: user?.sms,
      };
    });
  }

  async updateUserSms(payload: UpdateUserSmsDto) {
    if (!payload?.users?.length) {
      return [];
    }
    for (const user of payload?.users) {
      const userSms = await this.dataSource.manager.findOne(UserSmsEntity, {
        where: { usrId: user?.id },
      });
      if (userSms) {
        userSms.quantity = user?.sms?.quantity;
        user.sms = await this.dataSource.manager.save(UserSmsEntity, userSms);
      } else {
        user.sms = await this.dataSource.manager.save(UserSmsEntity, {
          quantity: user?.sms?.quantity,
          usrId: user?.id,
        } as UserSmsEntity);
      }
    }
    return payload.users;
  }
}
