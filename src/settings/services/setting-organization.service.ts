import { OrganizationEntity } from 'src/entities/organization.entity';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { SuccessResponse } from 'src/common/response/success.res';
import { UploadService } from 'src/upload/services/upload.service';
import { Connection, DataSource, Not, Repository } from 'typeorm';
import { UploadEntity } from 'src/entities/upload.entity';
import * as fs from 'fs';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { UserEntity } from 'src/entities/user.entity';
import { ErrorCode } from 'src/constants/error';
import { UpdateOrganizationDto } from '../dtos/setting-organization.dto';
import { AddressEntity } from 'src/entities/address.entity';
import axios from 'axios';
import { AccountStatusEnum } from 'src/enum/account-status.enum';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';

@Injectable()
export class SettingOrganizationService {
  constructor(
    private dataSource: DataSource,
    private connection: Connection,
    private uploadservice: UploadService,
    private configService: ConfigService,
    @InjectRepository(OrganizationEntity)
    private organizationRepository: Repository<OrganizationEntity>,
    @InjectRepository(UploadEntity)
    private uploadRepository: Repository<UploadEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  private async _getPractitioners(organizationId: number) {
    const user = await this.userRepository.find({
      where: {
        client: Not(AccountStatusEnum.TERMINATED),
        organizationId,
      },
      relations: {
        medical: true,
        eventTypes: true,
        setting: true,
      },
      order: {
        lastname: 'ASC',
        firstname: 'ASC',
      },
    });

    return user.filter((x) => x?.medical);
  }

  async update(
    organizationId: number,
    userId: number,
    body: UpdateOrganizationDto,
    logo: Express.Multer.File,
  ): Promise<SuccessResponse> {
    try {
      if (!userId || !organizationId) throw ErrorCode.FORBIDDEN;
      const currentOrg = await this.organizationRepository.findOne({
        where: { id: organizationId },
        relations: { address: true },
      });

      const userCurrent = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!currentOrg || !userCurrent) throw ErrorCode.NOT_FOUND;
      if (!userCurrent?.admin) {
        throw ErrorCode.PERMISSION_DENIED;
      }

      const allowedMimeTypes = [
        'image/gif',
        'image/jpeg',
        'image/png',
        'image/bmp',
        'image/x-windows-bmp',
        'image/x-ms-bmp',
        'image/tiff',
      ];

      const {
        name,
        email,
        phone_number,
        image_library_link,
        mode_desynchronise,
        address,
        settings,
        delete_logo,
      } = body;

      const countries = (
        await axios.get(this.configService.get<string>('app.countries.url'))
      ).data;

      let newAddress;
      if (!currentOrg?.address) {
        newAddress = new AddressEntity();
      } else {
        newAddress = currentOrg?.address;
      }
      newAddress.street = address?.street;
      newAddress.streetComp = address?.street2;
      newAddress.zipCode = address?.zip_code;
      newAddress.city = address?.city;
      newAddress.countryAbbr = address?.country_code;
      const country = countries.find(
        (x) => x?.cca2 === newAddress?.countryAbbr,
      );
      newAddress.country = country?.translations?.fra?.common;

      newAddress = await this.dataSource
        .getRepository(AddressEntity)
        .save(newAddress);

      let upload: UploadEntity;
      if (delete_logo) {
        currentOrg.logo = null;
      } else if (logo) {
        if (!allowedMimeTypes.includes(logo?.mimetype)) {
          throw 'invalid type file';
        }
        if (logo?.size > 40 * 1024 * 1024) {
          throw 'file lager than 40m';
        }

        const auth = `${organizationId.toString().padStart(5, '0')}`;
        const dir = await this.configService.get('app.uploadDir');
        await this.removeOldFile(currentOrg?.uplId, dir, auth);
        console.log('hihi');

        if (logo) {
          await this.uploadservice._checkGroupStorageSpace(
            organizationId,
            logo?.size,
          );
        }
        upload = await this.uploadservice._saveFilesInformationsIntoDatabase(
          logo,
          userCurrent,
          dir,
          auth,
        );
      }
      const practitioners = await this._getPractitioners(organizationId);

      for (const practitioner of practitioners) {
        const userSetting = practitioner?.setting;
        await this.dataSource.getRepository(UserPreferenceEntity).save({
          ...userSetting,
          sesamVitaleModeDesynchronise: mode_desynchronise,
        });
      }

      await this.organizationRepository.save({
        ...currentOrg,
        uplId: upload?.id,
        address: newAddress,
        name,
        email,
        phoneNumber: phone_number,
        imageLibraryLink: image_library_link,
        settings: settings,
      });
      return { success: true };
    } catch (error) {
      throw new CBadRequestException(error);
    }
  }

  async removeOldFile(id: number, dir: string, auth: string) {
    const oldFile = await this.uploadRepository.findOne({
      where: { id: id },
    });

    if (oldFile) {
      const filename = oldFile.name;
      if (fs.existsSync(`${dir}/${auth}/${filename}`)) {
        fs.unlinkSync(`${dir}/${auth}/${filename}`);
      }
      await this.uploadRepository.delete(oldFile.id);
    }
  }

  async deletePhoto(identity: UserIdentity): Promise<SuccessResponse> {
    const organizationId = identity?.org;
    const usrId = identity?.id;

    const useAdm = await this.dataSource
      .createQueryBuilder()
      .select('USR_ADMIN', 'admin')
      .from(UserEntity, 'USR')
      .where('USR.USR_ID = :usrId', { usrId })
      .getRawOne();

    if (useAdm?.admin === 0) {
      throw new CBadRequestException(ErrorCode.PERMISSION_DENIED);
    }

    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      // Récupération des informations de la photo d'identité
      const file = await this.dataSource
        .createQueryBuilder()
        .select('UPL.UPL_ID', 'id')
        .addSelect('UPL.UPL_NAME', 'filename')
        .from(OrganizationEntity, 'CON')
        .innerJoin(UploadEntity, 'UPL', 'CON.UPL_ID = UPL.UPL_ID')
        .where('CON.GRP_ID = :organizationId', { organizationId })
        .getRawOne();

      if (file) {
        const auth = `${organizationId.toString().padStart(5, '0')}`;
        const dir = this.configService.get('app.uploadDir');
        const fileId = file.id;
        const filename = file.filename;

        fs.unlinkSync(`${dir}/${auth}/${filename}`);

        await queryRunner.manager
          .createQueryBuilder()
          .delete()
          .from(UploadEntity)
          .where('UPL_ID = :fileId', { fileId })
          .execute();

        await queryRunner.manager
          .createQueryBuilder()
          .update(OrganizationEntity)
          .set({ uplId: null })
          .where('GRP_ID = :organizationId', { organizationId })
          .execute();
      }
      await queryRunner.commitTransaction();
      return { success: true };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw new CBadRequestException(e.message);
    } finally {
      await queryRunner.release();
    }
  }
}
