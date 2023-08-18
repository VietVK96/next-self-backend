import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdvanceSearchService } from './services/advanced-search.service';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { AdvancedSearchRes } from './res/advanced-seatch.res';

@ApiBearerAuth()
@Controller('/advanced-search')
@ApiTags('AdvancedSearch')
export class AdvancedSearchController {
  constructor(private advancedSearchService: AdvanceSearchService) {}

  /**
   * php/advancedSearchFilter/findAll.php
   * 18- 163
   *
   */
  @Get('')
  @UseGuards(TokenGuard)
  async getTraceability(
    @Query('name') name: string,
  ): Promise<AdvancedSearchRes[]> {
    return await this.advancedSearchService.getFilterByName(name);
  }
}
