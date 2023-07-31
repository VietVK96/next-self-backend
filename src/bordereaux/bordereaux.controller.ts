import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { Response } from 'express';
import { BordereauxService } from './service/bordereaux.service';
import { BordereauxDto } from './dto/index.dto';

@ApiBearerAuth()
@ApiTags('Bordereaux')
@Controller('/bordereaux')
export class BordereauxController {
  constructor(private bordereauxService: BordereauxService) {}

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
}
