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
import { DevisStd2Services } from './services/devisStd2.services';

@ApiBearerAuth()
@Controller('/dental')
@ApiTags('Dental')
export class DentalController {
  constructor(
    private ordonnancesServices: OrdonnancesServices,
    private factureServices: FactureServices,
    private devisStd2Services: DevisStd2Services,
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

  @Post('/ordonnances/ordo_email')
  @UseGuards(TokenGuard)
  async mail(@Body() payload: EnregistrerFactureDto) {
    return this.ordonnancesServices.getMail(payload);
  }

  @Get('/devisStd2/index')
  @UseGuards(TokenGuard)
  async getInitChampsDevisStd2(
    @Param('id_user') userId: number[],
    @Param('id_contact') contactId: number,
    @Param('no_pdt') noPdt: number,
    @Param('no_devis') noDevis: number,
    @CurrentUser() identity: UserIdentity,
  ) {
    return await this.devisStd2Services.getInitChamps(
      userId,
      contactId,
      noPdt,
      noDevis,
      identity,
    );
  }
}
