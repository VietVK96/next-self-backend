import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { CaresheetsDto } from './dto/index.dto';
import { ActsService } from './service/caresheets.service';
import { CaresheetStatusRes } from './reponse/index.res';

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

  /* php/user/caresheets/index.php
   * 16-121
   */
  @Get('/user')
  @UseGuards(TokenGuard)
  async getUserCaresheet(
    @CurrentUser() identity: UserIdentity,
    @Query('page') page?: number,
    @Query('page_size') size?: number,
    @Query('filterParam') filterParam?: string[],
    @Query('filterValue') filterValue?: string[],
  ) {
    return await this.service.getUserCaresheet(
      identity.id,
      page,
      size,
      filterParam,
      filterValue,
    );
  }

  /**
   * php/caresheets/statuses/index.php
   * 13-24
   */
  @Get('/status')
  @UseGuards(TokenGuard)
  async getAllCaresheetStatus(): Promise<CaresheetStatusRes[]> {
    return await this.service.getAllCaresheetStatus();
  }

  /**
   * sesam-vitale/caresheets/update.php
   * 16-61
   */
  @Post('/update')
  @UseGuards(TokenGuard)
  async update(@Query('id') id?: number) {
    return await this.service.update(id);
  }
}
