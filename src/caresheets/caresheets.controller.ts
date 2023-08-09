import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { CaresheetsDto } from './dto/index.dto';
import { ActsService } from './service/caresheets.service';

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
   * php/user/caresheets/index.php
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
}
