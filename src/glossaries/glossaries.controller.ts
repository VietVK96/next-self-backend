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
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { saveGlossaryEntryPayload } from './dto/saveEntry.glossaries';

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
  // @UseGuards(TokenGuard)
  async findGlossary(@Param('id') id: number) {
    return this.glossariesService.findGlossary(Number(id));
  }

  @Delete('entries/:id')
  // @UseGuards(TokenGuard)
  async deleteGlossary(@Param('id') id: number) {
    return this.glossariesService.deleteGlossary(Number(id));
  }

  @Post('entries')
  // @UseGuards(TokenGuard)
  async saveGlossaryEntry(@Body() payload: saveGlossaryEntryPayload) {
    console.log(payload);
  }
}
