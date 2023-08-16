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
import { FactureServices } from './services/facture.services';
import { DevisStd2Dto } from './dto/devisStd2.dto';
import {
  EnregistrerFactureDto,
  PrintPDFDto,
  FactureEmailDto,
} from './dto/facture.dto';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';

@ApiBearerAuth()
@Controller('/dental')
@ApiTags('Dental')
export class FactureController {
  constructor(private factureServices: FactureServices) {}

  @Post('/facture/facture_requetes_ajax')
  @UseGuards(TokenGuard)
  async update(@Body() payload: EnregistrerFactureDto) {
    return this.factureServices.requestAjax(payload);
  }

  /// dental/facture/facture_pdf.php
  @Get('/facture/facture_pdf')
  @UseGuards(TokenGuard)
  async getPdf(
    @Res() res,
    @Query() payload: PrintPDFDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    try {
      const buffer = await this.factureServices.generatePdf(payload, identity);

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

  /// dental/facture/facture_email.php
  @Get('/facture/facture-email')
  @UseGuards(TokenGuard)
  async factureEmail(
    @Query() req: FactureEmailDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return await this.factureServices.factureEmail(req, identity);
  }

  /// dental/facture/index.php?id_contact=1&id_user=1
  @Get('/facture/index')
  @UseGuards(TokenGuard)
  async getInitChampsFacture(
    @CurrentUser() identity: UserIdentity,
    @Query() params: DevisStd2Dto,
  ) {
    const { id_user, id_contact } = params;
    return await this.factureServices.getInitChamps(
      id_user,
      id_contact,
      identity,
    );
  }
}
