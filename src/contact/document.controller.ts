import {
  Controller,
  Post,
  Req,
  Get,
  UseGuards,
  UseInterceptors,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { DocumentServices } from './services/document.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';

@ApiBearerAuth()
@Controller('/contact')
@ApiTags('Document')
export class DocumentController {
  constructor(private documentService: DocumentServices) {}

  /**
   * /php/contact/document/upload.php -> full
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
    const type: string = request.body['type'];
    const page: string = request.body['page'];

    return await this.documentService.upload(
      user.org,
      contactId,
      files,
      type,
      page,
    );
  }

  /**
   * php/contact/document/findAll.php -> ful
   *
   */
  @Get('/document/:id')
  @UseGuards(TokenGuard)
  async findAll(
    @CurrentUser() identity: UserIdentity,
    @Param('id') id: number,
    @Query('type') type = 'file',
    @Query('tags') tags: string[] = [],
  ) {
    return await this.documentService.findAll(identity, id, type, tags);
  }
}
