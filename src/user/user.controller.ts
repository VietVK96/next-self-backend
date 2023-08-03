import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
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
import { ErrorCode } from 'src/constants/error';
import { GetOneActiveRes } from './res/get-active.res';

@ApiBearerAuth()
@ApiTags('User')
@Controller('/user')
export class UserController {
  constructor(
    private userService: UserService,
    private preferenceService: PreferenceService,
    private tokenDownloadService: TokenDownloadService,
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

  //settings/group/users.php
  //all line
  @Get('/active')
  @UseGuards(TokenGuard)
  async getActiveUser(@CurrentUser() identity: UserIdentity) {
    try {
      return await this.userService.getActiveUser(identity.org);
    } catch (error) {
      throw new CBadRequestException(ErrorCode.ERROR_GET_USER, error);
    }
  }

  @Get('/active/:id')
  @UseGuards(TokenGuard)
  async getOneActiveUser(
    @CurrentUser() identity: UserIdentity,
    @Param('id') id: number,
  ) {
    try {
      return await this.userService.getOneActiveUser(
        identity.id,
        id,
        identity.org,
      );
    } catch (error) {
      throw new CBadRequestException(ErrorCode.ERROR_GET_USER, error);
    }
  }

  //settings/group/user.php
  //all line
  @Put('/active/:id')
  @UseGuards(TokenGuard)
  async updateActiveUser(
    @CurrentUser() identity: UserIdentity,
    @Param('id') id: number,
    @Body() body: GetOneActiveRes,
  ) {
    return await this.userService.updateActiveUser(
      identity.id,
      id,
      identity.org,
      body,
    );
  }
}
