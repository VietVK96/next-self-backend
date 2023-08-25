import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { QuotationDevisRequestAjaxDto } from './dto/devis_request_ajax.dto';
import { QuotationServices } from './services/quotation.service';
import {
  PreferenceQuotationDto,
  QuotationInitChampsDto,
} from './dto/quotation.dto';

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

  /**
   * php/dental/quotation/delete.php -> full file
   * delete quotation
   */
  @Delete('/quotation/:id')
  @UseGuards(TokenGuard)
  async deleteNote(
    @CurrentUser() identity: UserIdentity,
    @Param('id') id: number,
  ): Promise<any> {
    return await this.quotationServices.deleteQuotation(identity, id);
  }

  /**
   * /php/user/preference/quotation/patch.php -> full file
   * patch preference quotation
   */
  @Patch('/preference/quotation/:id')
  @UseGuards(TokenGuard)
  async patchPreferenceQuotation(
    @CurrentUser() identity: UserIdentity,
    @Param('payload') payload: PreferenceQuotationDto,
    @Param('id') id: number,
  ): Promise<any> {
    return await this.quotationServices.patchPreferenceQuotation(
      id,
      identity,
      payload,
    );
  }

  // ecoophp/dental/quotation/devis_email.php
  @Get('/quotation/devis_email')
  @UseGuards(TokenGuard)
  async sendMail(
    @Query('id') id: number,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.quotationServices.sendMail(id, identity);
  }
}
