import {
  Body,
  Controller,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { DocumentServices } from './services/document.service';
import { EventTaskDto } from './dto/task.contact.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiBearerAuth()
@Controller('/contact')
@ApiTags('Document')
export class DocumentController {
  constructor(private documentService: DocumentServices) {}

  /**
   * /php/contact/document/upload.php
   *
   */
  @Post('/document/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'body upload document',
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
  @UseGuards(TokenGuard)
  async upload(@CurrentUser() user: UserIdentity, @Req() request: Request) {
    const contactId = request.body['contact'];
    const files: Express.Multer.File = request['file'];
    return await this.documentService.upload(user.org, contactId, files);
  }
}
