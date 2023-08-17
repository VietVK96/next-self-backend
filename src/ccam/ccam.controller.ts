import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CcamServices } from './services/ccam.service';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { CcamCheckCmuDto } from './dto/ccam-check-cmu.dto';
import { CcamDomtomDto } from './dto/ccam-domtom.dto';

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

  /**
   * php/ccam/cmu.php 100%
   */
  @Get('/cmu/:id')
  @UseGuards(TokenGuard)
  async cmuCheck(@Param('id') id: number, @Query() query: CcamCheckCmuDto) {
    return await this.ccamService.checkCmu(id, query);
  }

  /**
   * php/ccam/domtom.php
   *
   */
  @Get('/domtom/:id')
  @UseGuards(TokenGuard)
  async domtom(@Param('id') id: number, @Query() query: CcamDomtomDto) {
    return await this.ccamService.domtom(id, query);
  }
}
