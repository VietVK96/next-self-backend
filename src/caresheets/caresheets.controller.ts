import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { CaresheetsDto } from './dto/index.dto';
import { ActsService } from './service/caresheets.service';

@ApiBearerAuth()
@ApiTags('Caresheets')
@Controller('caresheets')
export class CaresheetsController {
  constructor(private service: ActsService) {}

  /**
   * file: php/service/caresheet/store.php
   */
  @Post('store')
  @UseGuards(TokenGuard)
  async store(@Body() request: CaresheetsDto) {
    return await this.service.store(request);
  }

  /**
   * file: php/caresheets/show.php
   */
  @Get('show')
  @UseGuards(TokenGuard)
  async show(@Query('id') id: number) {
    return await this.service.show(id);
  }
}
