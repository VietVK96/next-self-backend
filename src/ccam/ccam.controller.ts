import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CcamServices } from './services/ccam.service';
import { TokenGuard } from 'src/common/decorator/auth.decorator';

@Controller('ccam')
@ApiTags('Ccam')
@ApiBearerAuth()
export class CcamController {
  constructor(private readonly ccamService: CcamServices) {}

  /**
   * php/ccam/index.php 100%
   */
  @Get()
  @UseGuards(TokenGuard)
  async searchByName(@Query('search_term') search_term?: string) {
    return await this.ccamService.searchByName(search_term);
  }

  /**
   * php/ccam/show.php 100%
   */
  @Get('/:id')
  @UseGuards(TokenGuard)
  async show(@Param('id') id: number) {
    return await this.ccamService.show(id);
  }
}