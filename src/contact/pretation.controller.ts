import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { PrestationService } from './services/pretation.service';
import { PrestationDto } from './dto/prestation.dto';

@ApiBearerAuth()
@Controller('/prestation')
@ApiTags('Prestation')
export class PrestationController {
  constructor(private prestationService: PrestationService) {}

  /**
   *php/prestation/save.php
   *
   */

  @Post()
  // @UseGuards(TokenGuard)
  async updatePrestation(@Body() payload: PrestationDto) {
    return await this.prestationService.updatePrestation(payload);
  }
}
