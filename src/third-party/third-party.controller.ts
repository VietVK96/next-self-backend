import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { ThirdPartyService } from './third-party.service';
import { ThirdPartyDto } from './dto/index.dto';

@ApiBearerAuth()
@ApiTags('ThirdParty')
@Controller('/third-party')
export class ThirdPartyController {
  constructor(private thirdPartyService: ThirdPartyService) {}

  /**
   * File: php/third-party/index.php
   */
  @Get('index')
  @ApiBearerAuth()
  @UseGuards(TokenGuard)
  async getPatientThirdParty(@Query() payload: ThirdPartyDto) {
    return await this.thirdPartyService.getPatientThirdParty(payload);
  }
}
