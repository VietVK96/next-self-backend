import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { OrdonnancesServices } from './services/ordonnances.services';
import { OrdonnancesDto } from './dto/ordonnances.dto';
import { FactureServices } from './services/facture.services';
import { EnregistrerFactureDto } from './dto/facture.dto';

@ApiBearerAuth()
@Controller('/dental')
@ApiTags('Dental')
export class DentalController {
  constructor(
    private ordonnancesServices: OrdonnancesServices,
    private factureServices: FactureServices,
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

  @Post('/facture/facture_requetes_ajax')
  @UseGuards(TokenGuard)
  async update(@Body() payload: EnregistrerFactureDto) {
    return this.factureServices.update(payload);
  }
}
