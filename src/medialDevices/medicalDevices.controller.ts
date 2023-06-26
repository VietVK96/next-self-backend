import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FindMedicalDevicesService } from './services/find.medicalDevices.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';

@ApiBearerAuth()
@Controller('/medical-devices')
@ApiTags('Medical devices')
export class FindMedicalDevicesController {
  constructor(private service: FindMedicalDevicesService) {}

  // php/medical-devices/index.php
  @Get()
  @UseGuards(TokenGuard)
  async findAll(@CurrentUser() identity: UserIdentity) {
    return this.service.getMedicalDevices(identity.org);
  }
}
