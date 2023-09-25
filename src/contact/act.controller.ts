import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { ActServices } from './services/act.service';
import { ActDto, UpdateTraceabilitiesDto } from './dto/act.contact.dto';

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

  /**
   * php/acts/traceabilities/update.php
   *
   */
  @Patch('traceabilities/:id')
  @UseGuards(TokenGuard)
  async updateTraceabilities(
    @Param('id') id: number,
    @Body() payload: UpdateTraceabilitiesDto,
    @CurrentUser() userIdentity: UserIdentity,
  ) {
    return await this.actService.updateTraceabilities(
      id,
      payload,
      userIdentity.org,
    );
  }

  /**
   * php/acts/show.php
   *
   */
  @Get('show/:id')
  @UseGuards(TokenGuard)
  async getShowAct(@Param('id') id: number) {
    return await this.actService.getShowAct(id);
  }

  /**
   * php/acts/update.php
   *
   */
  @Patch('update/:id')
  @UseGuards(TokenGuard)
  async updateAct(@Param('id') id: number, @Body() payload: ActDto) {
    return await this.actService.updateAct(id, payload);
  }
}
