import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { AntecedentPrestationService } from './services/antecedent-prestation.service';
import { FindAllStructDto } from './dto/findAll.antecedent-prestation.dto';

@ApiBearerAuth()
@Controller('/antecedent-prestation')
@ApiTags('AntecedentPrestation')
export class AntecedentPrestationController {
  constructor(
    private antecedentPrestationServiceService: AntecedentPrestationService,
  ) {}

  //File php/contact/antecedentPrestation/findAll.php
  @Get('')
  @ApiHeader({
    name: 'X-DocterId',
    description: 'DocterId',
  })
  @UseGuards(TokenGuard)
  async findAllAntecedentPrestation(
    @Query() payload: FindAllStructDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.antecedentPrestationServiceService.findAll(
      payload,
      identity.org,
    );
  }
}
