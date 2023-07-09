import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { ContraindicationsService } from './services/contradications.service';

@ApiBearerAuth()
@ApiTags('Contraindications')
@Controller('/contraindications')
export class ContraindicationsController {
  constructor(private contraindicationsService: ContraindicationsService) {}

  /**
   * php/contraindications/index.php
   */
  @Get()
  @UseGuards(TokenGuard)
  async findAllContraindications(@CurrentUser() identity: UserIdentity) {
    return this.contraindicationsService.findAll(identity);
  }
}
