import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { Response } from 'express';
import { AddressBookService } from './services/address-book.service';

@Controller('address-books')
@ApiTags('Address-books')
@ApiBearerAuth()
export class AddressBookController {
  constructor(private addressService: AddressBookService) {}

  /**
   * File: php/address-books/export.php 100%
   *
   */
  @Get('export')
  @ApiBearerAuth()
  @UseGuards(TokenGuard)
  async export(
    @Res() res: Response,
    @Query('format') format: string,
    @CurrentUser() identity: UserIdentity,
  ) {
    return await this.addressService.export(res, format, identity);
  }
}
