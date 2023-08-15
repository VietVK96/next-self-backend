import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Query,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { DevisServices } from './services/devisHN.services';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { DevisHNServices } from './services/devisHNRequestAjax.service';
import {
  DevisHNGetInitChampDto,
  DevisHNPdfDto,
  DevisRequestAjaxDto,
} from './dto/devisHN.dto';

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

  @Get('devisHN/pdf')
  @UseGuards(TokenGuard)
  async devisHNGetPDF(
    @Res() res,
    @CurrentUser() user: UserIdentity,
    @Query() params: DevisHNPdfDto,
  ) {
    try {
      const buffer = await this.devisService.generatePDF(user, params);

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
    } catch (error) {
      throw new CBadRequestException(ErrorCode.ERROR_GET_PDF, error);
    }
  }
}
