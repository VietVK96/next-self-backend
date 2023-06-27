import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { ActServices } from './services/act.service';
import { UpdateTraceabilitiesDto } from './dto/act.contact.dto';

@ApiBearerAuth()
@Controller('/act')
@ApiTags('Act')
export class ActController {
  constructor(private actService: ActServices) {}

  /**
   * php/acts/traceabilities/show.php
   *
   */
  @Get('traceabilities/:id')
  @UseGuards(TokenGuard)
  async getTraceability(@Param('id') id: number) {
    return await this.actService.getTraceability(id);
  }

  @Patch('traceabilities/:id')
  @UseGuards(TokenGuard)
  async updateTraceabilities(
    @Param('id') id: number,
    @Body() payload: UpdateTraceabilitiesDto,
  ) {
    return await this.actService.updateTraceabilities(id, payload);
  }
}
