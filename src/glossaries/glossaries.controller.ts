import { GlossariesService } from './glossaries.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
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
import { UpdateGlossaryDto } from './dto/update.glossary.dto';
import { UpdateGlossaryEntryDto } from './dto/update.glossaryEntry.dto';

@ApiBearerAuth()
@ApiTags('Glossaries')
@Controller('settings/glossaries')
export class GlossriesController {
  constructor(private glossariesService: GlossariesService) {}

  @Get()
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
  async deleteGlossaryEntry(@Param('id') id: number) {
    return this.glossariesService.deleteGlossaryEntry(Number(id));
  }

  @Post('entries')
  @UseGuards(TokenGuard)
  async saveGlossaryEntry(
    @Body() payload: saveGlossaryEntryPayload,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.glossariesService.saveGlossaryEntry(payload, identity.org);
  }

  @Post()
  @UseGuards(TokenGuard)
  async saveGlossary(
    @Body() payload: SaveGlossaryDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.glossariesService.saveGlossary(payload, identity.org);
  }

  @Delete('/:id')
  @UseGuards(TokenGuard)
  async deleteGlossary(@Param('id') id: number) {
    return this.glossariesService.deleteGlossary(id);
  }

  @Post('/:id')
  @UseGuards(TokenGuard)
  async updateGlossary(
    @Param('id') id: number,
    @Body() payload: UpdateGlossaryDto,
  ) {
    return this.glossariesService.updateGlossary(id, payload);
  }

  @Put('entries/:id')
  @UseGuards(TokenGuard)
  async updateGlossaryEntry(
    @Body() payload: UpdateGlossaryEntryDto,
    @Param('id') id: number,
  ) {
    return this.glossariesService.updateGlossaryEntry(payload, id);
  }
}
