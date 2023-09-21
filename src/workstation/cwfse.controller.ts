import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ImagingSoftwareService } from './services/imaging-software.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { Request } from 'express';
import { ImageSoftwareDto } from './dto/image-software.dto';

@ApiBearerAuth()
@ApiTags('Cwfse')
@Controller('cwfse')
export class CwfController {
  constructor(private imagingSoftwareService: ImagingSoftwareService) {}

  // php/cwfse/imaging_software.php
  @Post('imaging_software')
  @UseGuards(TokenGuard)
  async imagingSoftware(
    @CurrentUser() identity: UserIdentity,
    @Req() req: Request,
    @Body() body: ImageSoftwareDto,
  ) {
    return await this.imagingSoftwareService.imagingSoftware(
      req,
      body,
      identity,
    );
  }
}
