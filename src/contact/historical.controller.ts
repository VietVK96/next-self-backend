import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiHeader } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { HistoricalService } from './services/historical.service';

@ApiBearerAuth()
@Controller('/contact')
@ApiTags('Contact')
export class HistoricalController {
  constructor(private historicalService: HistoricalService) {}

  /**
   * php/contact/historical/findAll.php 14->20
   *
   */
  @Get('historical/:id')
  @UseGuards(TokenGuard)
  async historicalGetALl(
    @CurrentUser() identity: UserIdentity,
    @Param('id') id: number,
  ) {
    return await this.historicalService.getALl(identity, id);
  }
}
