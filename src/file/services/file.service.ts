/**
 * FileUploader.php
 */
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UploadEntity } from 'src/entities/upload.entity';
import { ConfigService } from '@nestjs/config';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { sanitizeFilename } from 'src/common/util/file';
@Injectable()
export class FileService {
  constructor(
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
}
