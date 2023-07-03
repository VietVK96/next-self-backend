/**
 * FileUploader.php
 */
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { StringHelper } from 'src/utils/string-helper';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { UploadEntity } from 'src/entities/upload.entity';
import { OrganizationService } from 'src/organization/service/organization.service';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { PermissionService } from 'src/user/services/permission.service';
import { ContactEntity } from 'src/entities/contact.entity';

@Injectable()
export class UploadService {
  constructor(
    private dataSource: DataSource,
    private organizationService: OrganizationService,
    private configService: ConfigService,
    private permissionService: PermissionService,
    @InjectRepository(UploadEntity)
    private uploadRepository: Repository<UploadEntity>,
  ) {}

  private readonly ERR_EXCEED_QUOTAS = 201;
  private readonly STATUS_BAD_REQUEST = 400;

  async uploadPatientPhoto(
    user: UserIdentity,
    contactId: number,
    files: Express.Multer.File,
  ) {
    const queryBuilder = this.dataSource.createQueryBuilder();
    const contactCurrent = await queryBuilder
      .select()
      .from(ContactEntity, 'CON')
      .where('CON.CON_ID = :contactId', { contactId })
      .getRawOne();

    const groupId = contactCurrent?.organization_id;
    if (files) {
      await this._checkGroupStorageSpace(groupId, files?.size);
    }
    await this._saveFilesInformationsIntoDatabase(groupId, files, contactId);
  }

  async _checkGroupStorageSpace(groupId: number, fileSize: number) {
    if (!this.organizationService.hasStorageSpace(groupId, fileSize)) {
      await this.organizationService.getStorageSpace(groupId).then((data) => {
        const storageSpaceUsed = data?.storageSpaceUsed;
        const storageSpaceUsedAsString = StringHelper.formatBytes(
          storageSpaceUsed,
          'GB',
        );
        const totalStorageSpace = data?.totalStorageSpace;
        const totalStorageSpaceAsString = StringHelper.formatBytes(
          totalStorageSpace,
          'GB',
        );
        throw new CBadRequestException(
          `Espace de stockage insuffisant : ${storageSpaceUsedAsString} 
            utilisé(s) sur ${totalStorageSpaceAsString} disponible(s)`,
          this.ERR_EXCEED_QUOTAS,
        );
      });
    }
  }

  async _saveFilesInformationsIntoDatabase(
    groupId: number,
    files: Express.Multer.File,
    contactId: number,
  ): Promise<void> {
    const queryBuilder = this.dataSource.createQueryBuilder();
    const userCurrent = await queryBuilder
      .select()
      .from(UserEntity, 'USR')
      .where('USR.organizationId = :groupId', { groupId })
      .getRawOne();

    const token = userCurrent?.USR_TOKEN;
    const oldFile = await this.uploadRepository.findOne({ where: { token } });
    const auth = `${groupId.toString().padStart(5, '0')}`;
    const dir = await this.configService.get('app.uploadDir');

    try {
      if (!fs.existsSync(`${dir}/${auth}`)) {
        fs.mkdirSync(`${dir}/${auth}`, { recursive: true });
      }

      if (oldFile) {
        const filename = oldFile.name;
        if (fs.existsSync(`${dir}/${auth}/${filename}`)) {
          fs.unlinkSync(`${dir}/${auth}/${filename}`);
        }
        await this.uploadRepository.delete(oldFile.id);
      }

      if (files) {
        const mimeTypes = files?.mimetype;
        const uploadEntity = new UploadEntity();
        uploadEntity.path = `${auth}/`;
        uploadEntity.userId = userCurrent.USR_ID;
        uploadEntity.fileName = `${auth}/${files?.originalname}`;
        uploadEntity.name = files.originalname;
        uploadEntity.type = mimeTypes;
        uploadEntity.size = files.size;
        uploadEntity.token = userCurrent.USR_TOKEN;
        uploadEntity.user = userCurrent;
        const dirFile = `${dir}/${auth}/${files?.originalname}`;
        fs.writeFileSync(dirFile, files?.buffer);
        files['uploadEntity'] = uploadEntity;
        await this.dataSource.getRepository(UploadEntity).save(uploadEntity);
        const uplId = (
          await this.uploadRepository.findOne({ where: { token } })
        ).id;
        await this.dataSource
          .getRepository(ContactEntity)
          .update(contactId, { uplId });
      }
    } catch (error) {
      throw new CBadRequestException(error.message);
    }
  }

  async deletePatientPhoto(user: UserIdentity, contact: number): Promise<void> {
    const queryBuilder = this.dataSource.createQueryBuilder();
    const contactCurrent = await queryBuilder
      .select()
      .from(ContactEntity, 'CON')
      .where('CON.CON_ID = :contact', { contact })
      .getRawOne();
    const organizationId = contactCurrent?.organization_id;
    const userId = contactCurrent?.USR_ID;

    try {
      const hasPermission = await this.permissionService.hasPermission(
        'PERMISSION_DELETE',
        8,
        userId,
      );
      if (!hasPermission) {
      }
      // Récupération des informations de la photo d'identité
      const file = await this.dataSource
        .createQueryBuilder()
        .select('UPL.UPL_ID', 'id')
        .addSelect('UPL.UPL_NAME', 'filename')
        .from(ContactEntity, 'CON')
        .innerJoin(UploadEntity, 'UPL', 'CON.UPL_ID = UPL.UPL_ID')
        .where('CON.CON_ID = :contact', { contact })
        .andWhere('CON.organization_id = :organizationId', { organizationId })
        .getRawOne();

      if (file) {
        const auth = `${organizationId.toString().padStart(5, '0')}`;
        const dir = this.configService.get('app.uploadDir');
        const fileId = file.id;
        const filename = file.filename;

        fs.unlinkSync(`${dir}/${auth}/${filename}`);

        await this.dataSource
          .createQueryBuilder()
          .delete()
          .from(UploadEntity)
          .where('UPL_ID = :fileId', { fileId })
          .execute();

        await this.dataSource
          .createQueryBuilder()
          .update(ContactEntity)
          .set({ UPL_ID: null })
          .where('CON_ID = :contact', { contact })
          .execute();
      }
    } catch (e) {
      throw new CBadRequestException(e.message);
    }
  }
}
