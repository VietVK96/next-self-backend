import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FindMedicalDevicesService } from './services/find.medical-device.service';
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
