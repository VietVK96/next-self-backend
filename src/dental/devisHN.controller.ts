import { Body, Controller, Post, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { DevisHNGetInitChampDto, DevisRequestAjaxDto } from './dto/devisHN.dto';
import { DevisHNServices } from './services/devisHNRequestAjax.service';
import { DevisServices } from './services/devisHN.services';

@ApiBearerAuth()
@Controller('/dental')
@ApiTags('Dental')
export class DevisHNController {
  constructor(
    private devisHNService: DevisHNServices,
    private devisService: DevisServices,
  ) {}

  /**
   * /dental/devisHN/devisHN_requetes_ajax.php -> full file
   */

  @Post('/quotes/convention/devis-request-ajax')
  @UseGuards(TokenGuard)
  async devisRequetAjax(@Body() payload: DevisRequestAjaxDto) {
    return this.devisHNService.requestAjax(payload);
  }

  @Get('/quotes/convention/devis-request-ajax')
  @UseGuards(TokenGuard)
  async devisHNEmail() {
    // return this.devisHNService.email();
  }

  /**
   * dental/devisHN/devisHN_init_champs.php
   */
  @Get('/devisHN/init_champs')
  @UseGuards(TokenGuard)
  async devisHNGetInitChamp(
    @CurrentUser() user: UserIdentity,
    @Query() params: DevisHNGetInitChampDto,
  ) {
    return await this.devisService.getInitChamps(user, params);
  }
}
