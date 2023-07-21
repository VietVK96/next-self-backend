import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FindMedicalDevicesService } from './services/find.medical-device.service';
import { MedicalDevicesService } from './services/medical-device.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { CreateMedicalDeviceDto } from './dto/medical-device.dto';

@ApiBearerAuth()
@Controller('/medical-devices')
@ApiTags('Medical devices')
export class FindMedicalDevicesController {
  constructor(
    private service: FindMedicalDevicesService,
    private medicalDeviceSevice: MedicalDevicesService,
  ) {}

  // php/medical-devices/index.php
  @Get()
  @UseGuards(TokenGuard)
  async findAll(@CurrentUser() identity: UserIdentity) {
    return this.service.getMedicalDevices(identity.org);
  }

  //settings/medical-devices/create.php
  @Post()
  @UseGuards(TokenGuard)
  async create(
    @CurrentUser() identity: UserIdentity,
    @Body() payload: CreateMedicalDeviceDto,
  ) {
    return this.medicalDeviceSevice.createMedicalDevices(identity.org, payload);
  }

  //settings/medical-devices/edit.php
  @Put('/:id')
  @UseGuards(TokenGuard)
  async update(
    @Param('id') id: number,
    @Body() payload: CreateMedicalDeviceDto,
  ) {
    return this.medicalDeviceSevice.updateMedicalDevices(id, payload);
  }

  @Delete('/:id')
  @UseGuards(TokenGuard)
  async delete(@Param('id') id: number) {
    return this.medicalDeviceSevice.deleteMedicalDevices(id);
  }
}
