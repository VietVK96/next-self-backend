import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { PrintPDFDto } from './dto/facture.dto';
import { DevisRequestAjaxDto } from './dto/devis_request_ajax.dto';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { QuotationMutualServices } from './services/quotaion-mutual.services';
import { QuotationMutualInitChampsDto } from './dto/quotatio-mutual.dto';
import type { Response } from 'express';

@ApiBearerAuth()
@Controller('/dental')
@ApiTags('Dental')
export class QuotationMutualController {
  constructor(private quotationMutualServices: QuotationMutualServices) {}

  @Get('/quotation-mutual/init_champs')
  @UseGuards(TokenGuard)
  async quotationMutualInitChamps(
    @Query() req: QuotationMutualInitChampsDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.quotationMutualServices.initChamps(req, identity);
  }

  // dental/quotation-mutual/devis_pdf.php
  @Get('/quotation-mutual/devis_pdf')
  @UseGuards(TokenGuard)
  async devisPdf(
    @Res() res: Response,
    @Query() req: PrintPDFDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    try {
      const buffer = await this.quotationMutualServices.generatePdf(
        req,
        identity,
      );

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

  @Post('/quotation-mutual/devis_requetes_ajax')
  @UseGuards(TokenGuard)
  async devisRequestAjax(
    @Body() payload: DevisRequestAjaxDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.quotationMutualServices.devisRequestAjax(payload, identity);
  }

  // ecoophp/dental/quotation-mutual/devis_email.php
  @Get('/quotation-mutual/devis_email')
  @UseGuards(TokenGuard)
  async sendMail(
    @Query('id') id: number,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.quotationMutualServices.sendMail(id, identity);
  }
}
