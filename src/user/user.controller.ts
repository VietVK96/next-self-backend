import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { UserService } from './services/user.service';
import {
  UpdatePreferenceDto,
  UpdateTherapeuticDto,
  UpdateTherapeuticParamDto,
} from './dto/therapeutic.dto';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { PreferenceService } from './services/preference.sevece';
import { TokenDownloadService } from './services/token-download.service';
import { UnpaidService } from './services/unpaid.service';
import { UnpaidDto } from './dto/unpaid.dto';
import { Response } from 'express';

@ApiBearerAuth()
@ApiTags('User')
@Controller('/user')
export class UserController {
  constructor(
    private userService: UserService,
    private preferenceService: PreferenceService,
    private tokenDownloadService: TokenDownloadService,
    private unpaidService: UnpaidService,
  ) {}

  /**
   * php/contact/prestation/findAll.php 1->14
   * @param payload
   * @param identity
   * @returns
   */

  @Post('/therapeutic-alternatives/update')
  @UseGuards(TokenGuard)
  async updatePrestation(
    @Query() param: UpdateTherapeuticParamDto,
    @Body() payload: UpdateTherapeuticDto,
  ) {
    return await this.userService.updateUserMedical(param.user_id, payload);
  }

  @Get('/find')
  @UseGuards(TokenGuard)
  async findUserById(@Query('id') id: number) {
    if (!Number(id)) throw new CBadRequestException('id must be a number');
    return await this.userService.find(id);
  }

  @Post('preference/patch')
  @UseGuards(TokenGuard)
  async updatePreference(@Body() payload: UpdatePreferenceDto) {
    return await this.preferenceService.pacth(payload);
  }

  // File php/user/therapeutic-alternatives/index.php
  @Get('/therapeutic-alternatives')
  @UseGuards(TokenGuard)
  async getPrestation(@Query() param: UpdateTherapeuticParamDto) {
    return await this.userService.getTherapeutic(param.user_id);
  }

  // None file php. Improve
  @Post('create-token-download')
  @UseGuards(TokenGuard)
  async createTokenDownload(@CurrentUser() identity: UserIdentity) {
    const token = await this.tokenDownloadService.createTokenDownload(identity);
    return {
      token,
    };
  }

  // File php/user/unpaid/index.php
  @Get('unpaid/index')
  @UseGuards(TokenGuard)
  async getUserUnpaidPatient(@Query() payload: UnpaidDto) {
    return await this.unpaidService.getUserUnpaidPatient(payload);
  }

  /**
   * File: php/third-party/export.php
   */
  @Get('unpaid/export')
  async export(@Res() res: Response, @Query() payload: UnpaidDto) {
    return await this.unpaidService.getExportQuery(res, payload);
  }
}
