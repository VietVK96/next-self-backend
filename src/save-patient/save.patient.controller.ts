import { Body, Controller, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { SavePatientDto } from './dto/save.patient.dto';
import { SaveContactService } from './services/save.patient.services';

@ApiBearerAuth()
@Controller('/contact')
@ApiTags('Contact')
export class SaveContactController {
  constructor(private savePatientService: SaveContactService) {}

  // File php\contact\findAll.php 1->8
  @UseGuards(TokenGuard)
  @Post('/save')
  async createPatient(
    @Body() req: SavePatientDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.savePatientService.savePatient(req, identity.org);
  }

  @UseGuards(TokenGuard)
  @Put('/save/:id')
  async updatePatient(
    @Body() req: SavePatientDto,
    @Param('id') id: number,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.savePatientService.savePatient(req, identity.org);
  }
}