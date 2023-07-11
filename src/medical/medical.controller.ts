import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MedicalService } from './medical.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactEntity } from 'src/entities/contact.entity';
import { Repository } from 'typeorm';
import { BaseClaudeBernardCheckDto } from './dto/baseClaudeBernardCheck.medical.dto';
import { FindAllInProgressDto } from './dto/findAllInProgress.medical.dto';

@ApiBearerAuth()
@ApiTags('Medica')
@Controller('medical')
export class MedicalController {
  constructor(private medicalService: MedicalService) {}

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
