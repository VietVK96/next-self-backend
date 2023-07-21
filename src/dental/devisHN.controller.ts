import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { DevisRequestAjaxDto } from './dto/devisHN.dto';
import { DevisHNServices } from './services/devisRequestAjax.service';

@ApiBearerAuth()
@Controller('/dental')
@ApiTags('Dental')
export class DevisHNController {
  constructor(private devisHNService: DevisHNServices) {}

  /**
   * /dental/devisHN/devisHN_requetes_ajax.php -> full file
   */

  @Post('/quotes/convention/devis-request-ajax')
  @UseGuards(TokenGuard)
  async devisRequetAjax(@Body() payload: DevisRequestAjaxDto) {
    return this.devisHNService.requestAjax(payload);
  }
}
