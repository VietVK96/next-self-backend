import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { DsioImporterService } from './services/dsio-importer.service';
import { ImporterDsioDto } from './dto/importer-dsio.dto';

@ApiBearerAuth()
@Controller('/dsio')
@ApiTags('Dsio')
export class DsioController {
  constructor(private dsioImporterService: DsioImporterService) {}

  /**
   * php/dsio/importer.php -> full
   */
  @Post('/importer')
  @UseGuards(TokenGuard)
  async importer(
    @CurrentUser() user: UserIdentity,
    @Body() importerDsioDto: ImporterDsioDto,
  ) {
    return await this.dsioImporterService.importer(user, importerDsioDto);
  }
}
