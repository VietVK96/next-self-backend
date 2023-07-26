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
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { OrdonnancesServices } from './services/ordonnances.services';
import { OrdonnancesDto } from './dto/ordonnances.dto';
import { FactureServices } from './services/facture.services';
import { DevisStd2Services } from './services/devisStd2.services';
import { DevisStd2Dto } from './dto/devisStd2.dto';
import {
  EnregistrerFactureDto,
  PrintPDFDto,
  FactureEmailDto,
} from './dto/facture.dto';
import {
  DevisRequestAjaxDto,
  QuotationDevisRequestAjaxDto,
} from './dto/devis_request_ajax.dto';
import { DevisServices } from './services/devis.services';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { QuotationServices } from './services/quotation.service';

@ApiBearerAuth()
@Controller('/dental')
@ApiTags('Dental')
export class DentalController {
  constructor(
    private ordonnancesServices: OrdonnancesServices,
    private factureServices: FactureServices,
    private devisStd2Services: DevisStd2Services,
    private devisServices: DevisServices,
    private quotationServices: QuotationServices,
  ) {}

  /**
   * php/dental/quotation/delete.php -> full file
   * delete quotation
   */

  @Post('/ordonnances/ordo_requetes_ajax')
  @UseGuards(TokenGuard)
  async store(@Body() payload: OrdonnancesDto) {
    return this.ordonnancesServices.update(payload);
  }
  @Get('/ordonnances/medical/:patientId')
  @UseGuards(TokenGuard)
  async getMedical(
    @Param('patientId') patientId: number,
    @CurrentUser() identity: UserIdentity,
  ) {
    return await this.ordonnancesServices.getMedicalByPatientId(
      patientId,
      identity,
    );
  }

  @Post('/facture/facture_requetes_ajax')
  @UseGuards(TokenGuard)
  async update(@Body() payload: EnregistrerFactureDto) {
    return this.factureServices.update(payload);
  }

  /// dental/facture/facture_pdf.php
  @Get('/facture')
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

  @Post('/ordonnances/ordo_email')
  @UseGuards(TokenGuard)
  async mail(@Body() payload: EnregistrerFactureDto) {
    return this.ordonnancesServices.getMail(payload);
  }

  @Get('/devisStd2/index/')
  @UseGuards(TokenGuard)
  async getInitChampsDevisStd2(
    @CurrentUser() identity: UserIdentity,
    @Query() params: DevisStd2Dto,
  ) {
    const { id_user, id_contact, no_devis, no_pdt } = params;
    return await this.devisStd2Services.getInitChamps(
      id_user,
      id_contact,
      no_pdt,
      no_devis,
      identity,
    );
  }

  @Post('/quotation-mutual/devis_email')
  @UseGuards(TokenGuard)
  async devisEmail(@Body() payload: EnregistrerFactureDto) {
    return this.ordonnancesServices.getMail(payload);
  }

  @Post('/quotation-mutual/devis_requetes_ajax')
  @UseGuards(TokenGuard)
  async devisRequestAjax(
    @Body() payload: DevisRequestAjaxDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.devisServices.devisRequestAjax(payload, identity);
  }

  @Get('/quotation-mutual/send-email')
  @UseGuards(TokenGuard)
  async sendMail(@CurrentUser() identity: UserIdentity) {
    return this.devisServices.sendMail(identity);
  }

  @Post('/quotation/devis_requetes_ajax')
  @UseGuards(TokenGuard)
  async quotationMutualRequestsAjax(
    @Body() req: QuotationDevisRequestAjaxDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.quotationServices.quotationDevisRequestsAjax(req, identity);
  }

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
