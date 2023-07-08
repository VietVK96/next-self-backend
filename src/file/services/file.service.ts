/**
 * FileUploader.php
 */
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotAcceptableException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UploadEntity } from 'src/entities/upload.entity';
import { ConfigService } from '@nestjs/config';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { sanitizeFilename } from 'src/common/util/file';
import { UpdateFileDto } from '../dto/index.dto';
import { TagService } from 'src/tag/services/tag.service';
import { TagEntity } from 'src/entities/tag.entity';
import { PermissionService } from 'src/user/services/permission.service';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import * as fs from 'fs';
import { SuccessResponse } from 'src/common/response/success.res';

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
    const file = await this.uploadRepository.find({
      where: { id: id },
    });
    if (!file || file.length < 1) {
      throw new CNotFoundRequestException('file not found');
    }

    const originalFilename = sanitizeFilename(file[0].name);
    const fileName = file[0].fileName;
    const dir = await this.configService.get('app.uploadDir');

    return {
      mimeType: file[0].type,
      path: `${dir}/${fileName}`,
      originalFilename: originalFilename,
    };
  }

  async updateFile(id: number, payload: UpdateFileDto) {
    const file = await this.uploadRepository.findOne({
      where: { id: id },
    });
    const tags = [];
    if (!payload || !payload.original_filename) {
      throw new CBadRequestException('original_filename is required');
    }
    if (payload.tags && payload.tags.length > 0) {
      for (const tagId of payload.tags) {
        const tag = await this.tagRepository.findOne({ where: { id: tagId } });
        tags.push(tag);
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
    const file = await this.uploadRepository.findOne({
      where: { id: id },
    });
    if (!file) {
      throw new CBadRequestException('the file is not in existence');
    }
    await this.uploadRepository.delete({ id });

    const dir = await this.configService.get('app.uploadDir');
    const dirFile = `${dir}/${file?.fileName}`;
    fs.unlinkSync(dirFile);

    return { success: true };
  }
}
