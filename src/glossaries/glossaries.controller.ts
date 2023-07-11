import { GlossariesService } from './glossaries.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { saveGlossaryEntryPayload } from './dto/saveEntry.glossaries.dto';
import { SaveGlossaryDto } from './dto/save.glossaries.dto';

@ApiBearerAuth()
@ApiTags('Glossaries')
@Controller('glossaries')
export class GlossriesController {
  constructor(private glossariesService: GlossariesService) {}

  @Get('')
  @UseGuards(TokenGuard)
  async findGlossaries() {
    return this.glossariesService.findGlossaries();
  }

  @Get('/:id')
  @UseGuards(TokenGuard)
  async findGlossary(@Param('id') id: number) {
    return this.glossariesService.findGlossary(Number(id));
  }

  @Delete('entries/:id')
  @UseGuards(TokenGuard)
  async deleteGlossary(@Param('id') id: number) {
    return this.glossariesService.deleteGlossary(Number(id));
  }

  @Post('entries')
  @UseGuards(TokenGuard)
  async saveGlossaryEntry(
    @Body() payload: saveGlossaryEntryPayload,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.glossariesService.saveGlossaryEntry(payload, identity.org);
  }

  @Post('')
  @UseGuards(TokenGuard)
  async saveGlossary(
    @Body() payload: SaveGlossaryDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.glossariesService.saveGlossary(payload, identity.org);
  }
}
