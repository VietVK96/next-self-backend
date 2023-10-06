/**
 * FileUploader.php
 */
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { UploadEntity } from 'src/entities/upload.entity';
import { OrganizationService } from 'src/organization/service/organization.service';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { PermissionService } from 'src/user/services/permission.service';
import { ContactEntity } from 'src/entities/contact.entity';
import { StringHelper } from 'src/common/util/string-helper';
import { v4 as uuidv4 } from 'uuid';
import Jimp from 'jimp';

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
    const allowedMimeTypes = [
      'image/gif',
      'image/jpeg',
      'image/png',
      'image/bmp',
      'image/x-windows-bmp',
      'image/x-ms-bmp',
      'image/tiff',
    ];
    if (!allowedMimeTypes.includes(files.mimetype)) {
      throw new CBadRequestException('invalid type file');
    }
    if (files.size > 2 * 1024 * 1024) {
      throw new CBadRequestException('file lager than 2m');
    }
    const contactCurrent = await this.getContactCurrent(contactId);
    const groupId = contactCurrent?.organizationId;
    const userCurrent = await this.getCurrentUser(groupId);
    const auth = `${groupId.toString().padStart(5, '0')}`;
    const dir = await this.configService.get('app.uploadDir');
    this.removeOldFile(userCurrent, dir, auth);
    if (files) {
      await this._checkGroupStorageSpace(groupId, files?.size);
    }
    const upload = await this._saveFilesInformationsIntoDatabase(
      files,
      userCurrent,
      dir,
      auth,
    );

    await this.dataSource
      .getRepository(ContactEntity)
      .update(contactId, { uplId: upload?.id });
    return upload;
  }

  async getContactCurrent(contactId: number): Promise<ContactEntity> {
    const queryBuilder = this.dataSource
      .getRepository(ContactEntity)
      .createQueryBuilder();
    return await queryBuilder
      .select()
      .where('CON_ID = :contactId', { contactId })
      .getOne();
  }

  async getCurrentUser(groupId: number): Promise<UserEntity> {
    const queryBuilder = this.dataSource
      .getRepository(UserEntity)
      .createQueryBuilder();
    return await queryBuilder
      .select()
      .where('organization_id = :groupId', { groupId })
      .getOne();
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
  async removeOldFile(userCurrent: UserEntity, dir: string, auth: string) {
    const oldFile = await this.uploadRepository.findOne({
      where: { token: userCurrent?.token },
    });

    if (oldFile) {
      const filename = oldFile.name;
      if (fs.existsSync(`${dir}/${auth}/${filename}`)) {
        fs.unlinkSync(`${dir}/${auth}/${filename}`);
      }
      await this.uploadRepository.delete(oldFile.id);
    }
  }
  async _saveFilesInformationsIntoDatabase(
    files: Express.Multer.File,
    userCurrent: UserEntity,
    dir: string,
    auth: string,
  ): Promise<UploadEntity> {
    try {
      if (files) {
        const uploadEntity = new UploadEntity();
        let mimeTypes = files?.mimetype;
        let name = files.originalname;
        if (files?.mimetype === 'image/bmp') {
          mimeTypes = 'image/png';
          name = `${files.originalname?.split('.')?.[0]}.bmp.png`;
        }
        uploadEntity.name = files.originalname;
        const token = uuidv4();
        uploadEntity.path = `${auth}/`;
        uploadEntity.userId = userCurrent.id;
        uploadEntity.fileName = `${auth}/${name}`;
        uploadEntity.type = mimeTypes;
        uploadEntity.size = files.size;
        uploadEntity.token = token;
        uploadEntity.user = userCurrent;
        const dirFile = `${dir}/${auth}/${name}`;
        if (!fs.existsSync(`${dir}/${auth}`)) {
          fs.mkdirSync(`${dir}/${auth}`, { recursive: true });
        }
        if (files?.mimetype === 'image/bmp') {
          Jimp.read(files?.buffer, function (_, image) {
            if (image) {
              image.write(dirFile);
            }
          });
        } else {
          fs.writeFileSync(dirFile, files?.buffer);
        }
        files['uploadEntity'] = uploadEntity;
        return await this.dataSource
          .getRepository(UploadEntity)
          .save(uploadEntity);
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
          .set({ uplId: null })
          .where('CON_ID = :contact', { contact })
          .execute();
      }
    } catch (e) {
      throw new CBadRequestException(e.message);
    }
  }
}
