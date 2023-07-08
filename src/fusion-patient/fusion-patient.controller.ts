import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FusionPatientService } from './fusion-patient.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { SaveFusionPatientDto } from './dto/save.fusion-patient.dto';

@ApiBearerAuth()
@ApiTags('FusionPatient')
@Controller('/fusionPatient')
export class FusionPatienController {
  constructor(private fusionPatientService: FusionPatientService) {}

  @Get('/:id')
  @UseGuards(TokenGuard)
  async find(@CurrentUser() identity: UserIdentity, @Param('id') id: number) {
    return await this.fusionPatientService.find(id, identity.org);
  }

  @Post('/')
  @UseGuards(TokenGuard)
  async save(
    @Body() request: SaveFusionPatientDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return await this.fusionPatientService.save(
      identity.org,
      request.numeroDossierAConserver,
      request.numeroDossierASupprimer,
    );
  }
}
