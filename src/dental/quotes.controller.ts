import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { QuotesConventionDto } from './dto/quotes.dto';
import { QuotesServices } from './services/quotes.service';
import { PrintPDFDto } from './dto/facture.dto';
import { Convention2020RequestAjaxDto } from './dto/devis_request_ajax.dto';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { TokenDownloadGuard } from 'src/common/decorator/token-download.decorator';

@ApiBearerAuth()
@Controller('/dental')
@ApiTags('Dental')
export class QuotesController {
  constructor(private quotesServices: QuotesServices) {}
  @Post('quotes/devis/init')
  @UseGuards(TokenGuard)
  async devisInitChamp(
    @CurrentUser() identity: UserIdentity,
    @Body() payload: QuotesConventionDto,
  ) {
    return this.quotesServices.init(payload, identity);
  }

  @Post('/quotes/convention-2020/devis_requetes_ajax/:id')
  @UseGuards(TokenGuard)
  async convention2020RequestAjax(
    @Body() payload: Convention2020RequestAjaxDto,
    @Param('id') id: number,
  ) {
    return this.quotesServices.devisRequestAjax(payload, id);
  }

  /**
   * ecoophp/dental/quotes/convention-2020/devis_pdf.php
   * Line: 23-92
   */
  @Get('/quotes/convention-2020/devis_pdf')
  @UseGuards(TokenDownloadGuard)
  async quotesDevisPdf(@Res() res: Response, @Query() req: PrintPDFDto) {
    try {
      const buffer = await this.quotesServices.generatePdf(req);

      res.set({
        // pdf
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename=devis.pdf`,
        'Content-Length': buffer.length,
        // prevent cache
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: 0,
      });
      res.end(buffer);
    } catch (error) {
      throw new CBadRequestException(ErrorCode.ERROR_GET_PDF);
    }
  }

  // ecoophp/dental/quotes/convention-2020/devis_email.php
  @Get('/quotes/convention-2020/devis_email')
  @UseGuards(TokenGuard)
  async sendMail(
    @Query('id') id: number,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.quotesServices.sendMail(id, identity);
  }
}
