import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { ActServices } from './services/act.service';

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
}
