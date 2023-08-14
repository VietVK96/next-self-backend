import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BordereauxService } from './bordereaux.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { BordereauxDto } from './dto/index.dto';

@Controller('bordereaux')
@ApiTags('Bordereaux')
@ApiBearerAuth()
export class BordereauxController {
  constructor(private readonly bordereauxService: BordereauxService) {}

  //File: php/bordereaux/index.php
  @Get('index')
  @ApiBearerAuth()
  @UseGuards(TokenGuard)
  async getBordereaux(@Query() payload: BordereauxDto) {
    return await this.bordereauxService.getBordereaux(payload);
  }

  //File:php/bordereaux/payments/index.php
  @Get('payments/index')
  @ApiBearerAuth()
  @UseGuards(TokenGuard)
  async getBordereauxPayment(@Query() payload: BordereauxDto) {
    return await this.bordereauxService.getBordereauxPayment(payload);
  }

  //File:php/user/banks/index.php
  @Get('user/bank')
  @ApiBearerAuth()
  @UseGuards(TokenGuard)
  async getUserBank(@Query('id') id: number) {
    return await this.bordereauxService.getUserBank(id);
  }
  /**
   * File php/bordereaux/show.php 100%
   *
   * @param id
   * @returns
   */
  @Get('show/:id')
  @UseGuards(TokenGuard)
  findOne(@Param('id') id: string) {
    return this.bordereauxService.findOne(+id);
  }

  /**
   * File php/bordereaux/delete.php 100%
   * @param id
   * @param user
   * @returns
   */
  @Delete()
  @ApiBearerAuth()
  @UseGuards(TokenGuard)
  delete(@Query('id') id: number, @CurrentUser() user: UserIdentity) {
    return this.bordereauxService.delete(id, user);
  }
}
