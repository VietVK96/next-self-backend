import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MedicalService } from './services/medical.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { BaseClaudeBernardCheckDto } from './dto/baseClaudeBernardCheck.medical.dto';
import { FindAllInProgressDto } from './dto/findAllInProgress.medical.dto';

@ApiBearerAuth()
@ApiTags('Medica')
@Controller('medical')
export class MedicalController {
  constructor(private medicalService: MedicalService) {}

  /**
   * php/medical/order/baseClaudeBernardCheck.php
   */
  @Post('baseClaudeBernardCheck')
  @UseGuards(TokenGuard)
  async baseClaudeBernardCheck(
    @Body() payload: BaseClaudeBernardCheckDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.medicalService.baseClaudeBernardCheck(
      payload.contact,
      identity.org,
    );
  }

  /**
   * php/medical/order/findAllInProgress.php
   */
  @Post('findAllInProgress')
  @UseGuards(TokenGuard)
  async findAllInProgress(
    @Body() payload: FindAllInProgressDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.medicalService.findAllInProgress(
      identity.org,
      payload.contactId,
      payload.date,
    );
  }
}
