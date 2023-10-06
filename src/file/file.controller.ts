import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Res,
  UseGuards,
  Logger,
} from '@nestjs/common';
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
import { resizeThumbnail } from 'src/common/util/file';
import { UpdateFileDto } from './dto/index.dto';
import { ErrorCode } from 'src/constants/error';
import { TokenDownloadGuard } from 'src/common/decorator/token-download.decorator';

@ApiTags('File')
@Controller('files')
@ApiBearerAuth()
export class FileController {
  private logger: Logger = new Logger(FileController.name);
  constructor(private fileService: FileService) {}

  /**
   * php/files/download.php -> full
   *
   */
  @Get('/download/:id')
  @UseGuards(TokenDownloadGuard)
  async downloadFile(@Param('id') id: number, @Res() res: Response) {
    await this.fileService.downloadFile(id, res);
  }

  /**
   * php/files/inline.php -> full
   *
   */
  @Get('/inline/:id')
  @UseGuards(TokenDownloadGuard)
  async openInline(@Param('id') id: number, @Res() res: Response) {
    await this.fileService.previewFile(id, res);
  }

  /**
   * php/files/thumbnail.php -> full
   *
   */
  @Get('/thumbnail/:id')
  @UseGuards(TokenDownloadGuard)
  async fileThubmnail(
    @CurrentUser() user: UserIdentity,
    @Param('id') id: number,
    @Res() res: Response,
  ) {
    try {
      const { mimeType, path } = await this.fileService.getPathFile(id);
      const streamFile = resizeThumbnail(path, mimeType.split('/')[1]);
      streamFile.on('error', (err) => {
        const streamFileFail = resizeThumbnail(
          join(process.cwd(), 'resources/front/no_image.png'),
          'jpg',
        );
        res.setHeader('Content-Type', 'image/png');
        streamFileFail.pipe(res);
      });
      streamFile.pipe(res);
    } catch (error) {
      const streamFile = resizeThumbnail(
        join(process.cwd(), 'resources/front/no_image.png'),
        'jpg',
      );

      res.setHeader('Content-Type', 'image/png');
      streamFile.pipe(res);
    }
  }

  /**
   * php/files/update.php -> full
   *
   */
  @Patch('/:id')
  @UseGuards(TokenGuard)
  async update(
    @CurrentUser() user: UserIdentity,
    @Param('id') id: number,
    @Body() payload: UpdateFileDto,
  ) {
    try {
      return await this.fileService.updateFile(id, payload, user);
    } catch (error) {
      throw new CBadRequestException(ErrorCode.CANNOT_UPDATE_FILE, error);
    }
  }

  /**
   * php/files/delete.php -> full
   *
   */
  @Delete('/:id')
  @UseGuards(TokenGuard)
  async delete(@CurrentUser() identity: UserIdentity, @Param('id') id: number) {
    try {
      return await this.fileService.deleteFile(id, identity);
    } catch (error) {
      throw new CBadRequestException('cannot delete file', error);
    }
  }
}
