import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { OrdonnancesServices } from './services/ordonnances.services';
import { OrdonnancesDto } from './dto/ordonnances.dto';
import { FactureServices } from './services/facture.services';
import { EnregistrerFactureDto } from './dto/facture.dto';
import { DevisRequestAjaxDto } from './dto/devis_request_ajax.dto';
import { DevisServices } from './services/devis.services';

@ApiBearerAuth()
@Controller('/dental')
@ApiTags('Dental')
export class DentalController {
  constructor(
    private ordonnancesServices: OrdonnancesServices,
    private factureServices: FactureServices,
    private devisServices: DevisServices,
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

  @Get('/ordonnances/medical/:id_user/:id_contact')
  @UseGuards(TokenGuard)
  async getInitChamps(
    @Param('id_user') userId: number[],
    @Param('id_contact') contactId: number,
    @CurrentUser() identity: UserIdentity,
  ) {
    return await this.factureServices.getInitChamps(
      userId,
      contactId,
      identity,
    );
  }

  @Post('/ordonnances/ordo_email')
  @UseGuards(TokenGuard)
  async mail(@Body() payload: EnregistrerFactureDto) {
    return this.ordonnancesServices.getMail(payload);
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
}
