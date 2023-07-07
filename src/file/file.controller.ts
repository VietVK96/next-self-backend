import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FileService } from './services/file.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { Response } from 'express';
import { join } from 'path';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { addTextToImage, resizeThumbnail } from 'src/common/util/file';

@ApiTags('File')
@Controller('files')
@ApiBearerAuth()
export class FileController {
  constructor(private fileService: FileService) {}

  /**
   * php/files/download.php -> full
   *
   */
  @Get('/download/:id')
  @UseGuards(TokenGuard)
  async downloadFile(
    @CurrentUser() user: UserIdentity,
    @Param('id') id: number,
    @Res() res: Response,
  ) {
    try {
      const { mimeType, path, originalFilename } =
        await this.fileService.getPathFile(id);
      const disposition = `attachment; filename="${originalFilename}"`;

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', disposition);
      res.sendFile(join(__dirname, '..', '..', path));
    } catch (error) {
      throw new CBadRequestException('file not found', error);
    }
  }

  /**
   * php/files/inline.php -> full
   *
   */
  @Get('/inline/:id')
  @UseGuards(TokenGuard)
  async openInline(
    @CurrentUser() user: UserIdentity,
    @Param('id') id: number,
    @Res() res: Response,
  ) {
    try {
      const { mimeType, path, originalFilename } =
        await this.fileService.getPathFile(id);

      const disposition = `inline; filename="${originalFilename}"`;

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', disposition);
      res.sendFile(join(__dirname, '..', '..', path));
    } catch (error) {
      throw new CBadRequestException('file not found', error);
    }
  }

  /**
   * php/files/thumbnail.php -> full
   *
   */
  @Get('/thumbnail/:id')
  @UseGuards(TokenGuard)
  async fileThubmnail(
    @CurrentUser() user: UserIdentity,
    @Param('id') id: number,
    @Res() res: Response,
  ) {
    try {
      const { mimeType, path } = await this.fileService.getPathFile(id);

      const streamFile = resizeThumbnail(path, mimeType.split('/')[1]);

      streamFile.pipe(res);
    } catch (error) {
      const notFoundPath = '/front/notfound.jpg';
      const fullPath = join(__dirname, '..', '..', notFoundPath);
      const streamFile = await addTextToImage(fullPath, 'nnon disponible');

      res.setHeader('Content-Type', 'image/png');
      res.send(streamFile);
    }
  }
}
