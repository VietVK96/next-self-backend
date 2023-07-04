import {
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UploadService } from './services/upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { Request } from 'express';

@ApiTags('Upload')
@Controller('upload')
@ApiBearerAuth()
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'file image/pdf',
        },
        contact: {
          type: 'number',
        },
      },
      required: ['file', 'contact'],
    },
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(TokenGuard)
  async uploadPatientPhoto(
    @CurrentUser() user: UserIdentity,
    @Req() request: Request,
  ) {
    const contactId = request.body['contact'];
    const files: Express.Multer.File = request['file'];
    return await this.uploadService.uploadPatientPhoto(user, contactId, files);
  }

  @Delete(':contact')
  @UseGuards(TokenGuard)
  async deletePatientPhoto(
    @CurrentUser() user: UserIdentity,
    @Param('contact') contact: number,
  ) {
    return await this.uploadService.deletePatientPhoto(user, contact);
  }
}
