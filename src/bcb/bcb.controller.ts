import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { BcbServices } from './services/bcb.services';
import { BcbDto, BcbFindOneDto } from './dto/bcb.dto';
import { identity } from 'rxjs';

@Controller('bcb')
@ApiTags('Bcb')
@ApiBearerAuth()
export class BcbController {
  constructor(private readonly bcbServices: BcbServices) {}

  // php/bcb/findAll.php full file
  //same as file in src/settings/settings.controller.ts -> @Get('/medicament-database/find')
  @Post()
  @UseGuards(TokenGuard)
  async findAll(@Body() payload: BcbDto) {
    return await this.bcbServices.findAll(payload);
  }

  @Get('find')
  @UseGuards(TokenGuard)
  async findOne(
    @Query() payload: BcbFindOneDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return await this.bcbServices.findOne(payload, identity);
  }
}
