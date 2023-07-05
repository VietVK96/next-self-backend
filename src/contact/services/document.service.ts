import { Injectable } from '@nestjs/common';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { UploadService } from '../../upload/services/upload.service';
import { SuccessResponse } from 'src/common/response/success.res';
@Injectable()
export class DocumentServices {
  constructor(private readonly uploadservice: UploadService) {}

  async upload(
    orgId: number,
    contactId: number,
    file: Express.Multer.File,
  ): Promise<SuccessResponse> {
    console.log('contactId', contactId);
    console.log('file', file);
    const allowedMimeTypes = [
      'image/gif',
      'image/jpeg',
      'image/png',
      'image/bmp',
      'image/x-windows-bmp',
      'image/x-ms-bmp',
      'image/tiff',
    ];
    // if file !== 'file'
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new CBadRequestException('invalid type file');
    }
    if (file.size > 40 * 1024 * 1024) {
      throw new CBadRequestException('file lager than 40m');
    }
    if (file) {
      await this.uploadservice._checkGroupStorageSpace(orgId, file?.size);
    }
    await this.uploadservice._saveFilesInformationsIntoDatabase(
      orgId,
      file,
      contactId,
    );

    return { success: true };
  }
}
