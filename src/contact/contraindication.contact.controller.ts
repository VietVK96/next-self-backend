import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ContraindicationContactService } from './services/contraindication.contact.service';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { SaveContraindicationDto } from './dto/contraindication.contact.dto';

@ApiBearerAuth()
@Controller('/contact')
@ApiTags('ContraindicationContact')
export class ContraindicationContactController {
  constructor(
    private contraindicationService: ContraindicationContactService,
  ) {}

  /**
   * php/contact/contraindication/save.php
   */
  @Post('contraindication/save')
  @UseGuards(TokenGuard)
  async saveContraindication(@Body() payload: SaveContraindicationDto) {
    return await this.contraindicationService.saveContraindication(payload);
  }
}
