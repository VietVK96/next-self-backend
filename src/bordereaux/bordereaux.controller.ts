import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  Res,
  Post,
  Body,
} from '@nestjs/common';
import type { Response } from 'express';
import { BordereauxService } from './bordereaux.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { BordereauxDto, BordereauxStoreDto } from './dto/index.dto';

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
  async findOne(@Param('id') id: string) {
    return await this.bordereauxService.findOne(+id);
  }

  /**
   * File php/bordereaux/print.php 100%
   *
   * @param id
   * @returns
   */
  @Get('print/:id')
  @UseGuards(TokenGuard)
  async printPdf(@Res() res: Response, @Param('id') id: number) {
    const buffer = await this.bordereauxService.printPdf(id);
    res.set({
      // pdf
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=print.pdf`,
      'Content-Length': buffer.length,
      // prevent cache
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: 0,
    });
    res.end(buffer);
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

  /**
   * File php/bordereaux/store.php 100%
   *
   */
  @Post('store')
  @ApiBearerAuth()
  @UseGuards(TokenGuard)
  store(@Body() payload: BordereauxStoreDto) {
    return this.bordereauxService.store(payload);
  }
}
