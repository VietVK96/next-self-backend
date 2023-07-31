import {
  Controller,
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
import { ImportServices } from './services/import.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';

@ApiBearerAuth()
@Controller('/import')
@ApiTags('Import')
export class ImportController {
  constructor(private importService: ImportServices) {}

  /**
   * php/import.php -> full
   *
   */
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'body import',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'file dsio',
        },
        action: {
          type: 'string',
        },
      },
      required: ['file', 'action'],
    },
  })
  @UseGuards(TokenGuard)
  async import(@CurrentUser() user: UserIdentity, @Req() request: Request) {
    const action = request.body['action'];
    const file: Express.Multer.File = request['file'];

    return await this.importService.import(user.org, action, file);
  }
}
