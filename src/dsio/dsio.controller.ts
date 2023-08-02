import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { DsioService } from './services/dsio.service';
import { ImporterDsioDto } from './dto/importer-dsio.dto';

@ApiBearerAuth()
@Controller('/dsio')
@ApiTags('Dsio')
export class DsioController {
  constructor(private dsioService: DsioService) {}

  /**
   * php/dsio/importer.php -> full
   */
  @Post('/importer')
  @UseGuards(TokenGuard)
  async importer(
    @CurrentUser() user: UserIdentity,
    @Body() importerDsioDto: ImporterDsioDto,
  ) {
    return await this.dsioService.importer(user, importerDsioDto);
  }
}
