/**
 * FileUploader.php
 */
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotAcceptableException } from '@nestjs/common';
import { FindOptionsWhere, Repository } from 'typeorm';
import { UploadEntity } from 'src/entities/upload.entity';
import { ConfigService } from '@nestjs/config';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { sanitizeFilename } from 'src/common/util/file';
import { UpdateFileDto } from '../dto/index.dto';
import { TagEntity } from 'src/entities/tag.entity';
import { PermissionService } from 'src/user/services/permission.service';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import * as fs from 'fs';
import { SuccessResponse } from 'src/common/response/success.res';
import { ErrorCode } from 'src/constants/error';
import { Response } from 'express';

@Injectable()
export class FileService {
  constructor(
    private permissionService: PermissionService,
    @InjectRepository(TagEntity)
    private tagRepository: Repository<TagEntity>,
    private configService: ConfigService,
    @InjectRepository(UploadEntity)
    private uploadRepository: Repository<UploadEntity>,
  ) {}

  async getPathFile(id: number) {
    const file = await this.uploadRepository.findOne({
      where: { id: id },
    });
    if (!file) {
      throw new CNotFoundRequestException(ErrorCode.FILE_NOT_FOUND);
    }

    const originalFilename = sanitizeFilename(file.name);
    const fileName = file.fileName;
    const dir = await this.configService.get('app.uploadDir');
    const fullPath = `${dir}/${fileName}`;
    if (!fs.existsSync(fullPath)) {
      throw new CBadRequestException(ErrorCode.FILE_NOT_FOUND);
    }
    return {
      mimeType: file.type,
      path: fullPath,
      originalFilename: originalFilename,
      filePath: fileName,
    };
  }

  async previewFile(id: number, res: Response) {
    try {
      const { mimeType, filePath, originalFilename } = await this.getPathFile(
        id,
      );
      const disposition = `inline; filename="${originalFilename}"`;
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', disposition);
      const dir = await this.configService.get('app.uploadDir');
      res.sendFile(filePath, { root: dir });
    } catch (error) {
      res.status(404).send(ErrorCode.FILE_NOT_FOUND);
    }
  }

  async downloadFile(id: number, res: Response) {
    try {
      const { mimeType, filePath, originalFilename } = await this.getPathFile(
        id,
      );
      const disposition = `attachment; filename="${originalFilename}"`;
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', disposition);
      const dir = await this.configService.get('app.uploadDir');
      res.sendFile(filePath, { root: dir });
    } catch (error) {
      res.status(404).send(ErrorCode.FILE_NOT_FOUND);
    }
  }

  async updateFile(id: number, payload: UpdateFileDto, user: UserIdentity) {
    const file = await this.uploadRepository.findOne({
      where: { id: id },
    });
    if (!file) throw new CBadRequestException(ErrorCode.CANNOT_UPDATE_FILE);
    const tags = [];
    if (!payload || !payload.original_filename) {
      throw new CBadRequestException(ErrorCode.ORIGINAL_FILENAME_IS_REQUIRED);
    }
    if (payload.tags && payload.tags.length > 0) {
      for (const tagParam of payload.tags) {
        const condition: FindOptionsWhere<TagEntity> =
          typeof tagParam == 'number'
            ? { id: tagParam, organizationId: user?.org }
            : { internalReference: tagParam, organizationId: user?.org };
        const tag = await this.tagRepository.findOne({
          where: condition,
        });
        if (tags) tags.push(tag);
      }
    }
    file.tags = tags;

    // $violations = $container->get('validator')->validate($file);
    const fileUpdate = await this.uploadRepository.save({
      ...file,
      name: payload.original_filename,
    });

    return {
      id: id,
      original_filename: fileUpdate.name,
      file_name: fileUpdate.fileName,
      file_size: fileUpdate.size,
      mime_type: fileUpdate.type,
      tags: fileUpdate.tags,
    };
  }

  async deleteFile(
    id: number,
    identity: UserIdentity,
  ): Promise<SuccessResponse> {
    if (
      !this.permissionService.hasPermission('PERMISSION_DELETE', 8, identity.id)
    ) {
      throw new NotAcceptableException();
    }
    try {
      const file = await this.uploadRepository.findOne({
        where: { id: id },
      });
      if (!file) {
        throw new CBadRequestException(ErrorCode.FILE_NOT_FOUND);
      }
      await this.uploadRepository.delete({ id });

      const dir = await this.configService.get('app.uploadDir');
      const dirFile = `${dir}/${file?.fileName}`;
      fs.unlinkSync(dirFile);

      return { success: true };
    } catch (error) {
      throw new CBadRequestException(ErrorCode.DELETE_UNSUCCESSFUL);
    }
  }
}
