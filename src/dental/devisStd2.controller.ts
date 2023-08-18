import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { DevisStd2Services } from './services/devisStd2.services';
import { DevisStd2Dto } from './dto/devisStd2.dto';
import { PrintPDFDto } from './dto/facture.dto';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';

@ApiBearerAuth()
@Controller('/dental')
@ApiTags('Dental')
export class DevisStd2Controller {
  constructor(private devisStd2Services: DevisStd2Services) {}
  //ecoophp/dental/devisStd2/devisStd2_pdf.php
  @Get('/devisStd2/devisStd2_pdf')
  @UseGuards(TokenGuard)
  async getDevisStd2Pdf(
    @Res() res,
    @Query() payload: PrintPDFDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    try {
      const buffer = await this.devisStd2Services.generatePdf(
        payload,
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

  // dental/devisStd2/devis_email.php
  @Get('/devisStd2/index')
  @UseGuards(TokenGuard)
  async getInitChampsDevisStd2(
    @CurrentUser() identity: UserIdentity,
    @Query() params: DevisStd2Dto,
  ) {
    return await this.devisStd2Services.getInitChamps(params, identity);
  }

  // ecoophp/dental/devisStd2/devisStd2_email.php
  @Get('/devisStd2/devisStd2_email')
  @UseGuards(TokenGuard)
  async sendMail(
    @Query('id') id: number,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.devisStd2Services.sendMail(id, identity);
  }
}
