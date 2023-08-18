import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { QuotationDevisRequestAjaxDto } from './dto/devis_request_ajax.dto';
import { QuotationServices } from './services/quotation.service';
import { QuotationInitChampsDto } from './dto/quotation.dto';

@ApiBearerAuth()
@Controller('/dental')
@ApiTags('Dental')
export class QuotationController {
  constructor(private quotationServices: QuotationServices) {}

  // ecoophp/dental/quotation/devis_requetes_ajax.php
  @Post('/quotation/devis_requetes_ajax')
  @UseGuards(TokenGuard)
  async quotationRequestsAjax(
    @Body() req: QuotationDevisRequestAjaxDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.quotationServices.quotationDevisRequestsAjax(req, identity);
  }

  // ecoophp/dental/quotation/devis_init_champs.php
  @Get('/quotation/init')
  @UseGuards(TokenGuard)
  async quotationInitChamps(
    @Query() req: QuotationInitChampsDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.quotationServices.initChamps(req, identity);
  }
}
