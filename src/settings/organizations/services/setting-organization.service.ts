import { OrganizationEntity } from 'src/entities/organization.entity';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { SuccessResponse } from 'src/common/response/success.res';
import { UploadService } from 'src/upload/services/upload.service';
import { PermissionService } from 'src/user/services/permission.service';
import { Connection, DataSource, Repository } from 'typeorm';
import { UploadEntity } from 'src/entities/upload.entity';
import * as fs from 'fs';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { UserEntity } from 'src/entities/user.entity';
import { ErrorCode } from 'src/constants/error';

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
    
  ) {}

  async upload(
    orgId: number,
    page: string,
    file?: Express.Multer.File,
  ): Promise<SuccessResponse> {
    const allowedMimeTypes = [
      'image/gif',
      'image/jpeg',
      'image/png',
      'image/bmp',
      'image/x-windows-bmp',
      'image/x-ms-bmp',
      'image/tiff',
    ];
    if (!allowedMimeTypes.includes(file.mimetype) && page !== 'document') {
      throw new CBadRequestException('invalid type file');
    }
    if (file.size > 40 * 1024 * 1024) {
      throw new CBadRequestException('file lager than 40m');
    }

    const userCurrent = await this.uploadservice.getContactCurrent(orgId);
    const auth = `${orgId.toString().padStart(5, '0')}`;
    const dir = await this.configService.get('app.uploadDir');
    const currentOrg = await this.organizationRepository.findOne({where: {id: orgId}});
     this.removeOldFile(currentOrg.uplId, dir, auth);
    if (file) {
      await this.uploadservice._checkGroupStorageSpace(orgId, file?.size);
    }
    const upload = await this.uploadservice._saveFilesInformationsIntoDatabase(
      file,
      userCurrent,
      dir,
      auth,
      );
    await this.organizationRepository.save({...currentOrg,uplId: upload.id})    
    return { success: true };
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
    .select("USR_ADMIN","admin")
    .from(UserEntity,"USR")
    .where("USR.USR_ID = :usrId",{usrId})
    .getRawOne();

    if(useAdm?.admin === 0) {
      throw new CBadRequestException(ErrorCode.PERMISSION_DENIED)
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
