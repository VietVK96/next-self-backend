import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  Delete,
  Res,
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
import { PreferenceService } from './services/preference.service';
import { TokenDownloadService } from './services/token-download.service';
import { UnpaidService } from './services/unpaid.service';
import { UnpaidDto, printUnpaidDto } from './dto/unpaid.dto';
import { UpdatePassWordSettingDto } from './dto/user-setting.dto';
import { ErrorCode } from 'src/constants/error';
import { GetOneActiveRes } from './res/get-active.res';
import * as dayjs from 'dayjs';
import { CreditBalancesService } from './services/credit-balances.service';
import { CreditBalancesDto } from './dto/credit-balances.dto';
import type { Response } from 'express';
import { UpdateUserSmsDto } from './dto/user-sms.dto';
import { UserConnectionService } from './services/user-connection.service';

@ApiBearerAuth()
@ApiTags('User')
@Controller('/user')
export class UserController {
  constructor(
    private userService: UserService,
    private preferenceService: PreferenceService,
    private tokenDownloadService: TokenDownloadService,
    private unpaidService: UnpaidService,
    private creditBalancesService: CreditBalancesService,
    private userConnectionService: UserConnectionService,
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
  // file settings/securities/password-accounting/index.php
  @Get('/settings/securities/password-accounting')
  @UseGuards(TokenGuard)
  async getPassword(@CurrentUser() userIdentity: UserIdentity) {
    return await this.userService.getPasswordAccounting(userIdentity.id);
  }

  // file settings/securities/password-accounting/store.php
  @UseGuards(TokenGuard)
  @Post('/settings/securities/password-accounting/create')
  createPasswordSettings(
    @Body() PassWordSettingDto: UpdatePassWordSettingDto,
    @CurrentUser() user: UserIdentity,
  ) {
    return this.userService.createPasswordAccounting(
      user.id,
      PassWordSettingDto,
    );
  }

  // file settings/securities/password-accounting/update.php
  @UseGuards(TokenGuard)
  @Post('/settings/securities/password-accounting/update')
  updatePasswordSettings(
    @Body() updatePassWordSettingDto: UpdatePassWordSettingDto,
    @CurrentUser() user: UserIdentity,
  ) {
    return this.userService.updatePasswordAccounting(
      user.id,
      updatePassWordSettingDto,
    );
  }

  // file settings/securities/password-accounting/delete.php
  @UseGuards(TokenGuard)
  @Delete('/settings/securities/password-accounting/delete')
  deletePasswordSettings(
    @Body() PassWordSettingDto: UpdatePassWordSettingDto,
    @CurrentUser() user: UserIdentity,
  ) {
    return this.userService.deletePasswordAccounting(
      user.id,
      PassWordSettingDto,
    );
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

  @Get('unpaid/print')
  @UseGuards(TokenGuard)
  async printUnpaid(@Res() res: Response, @Query() param?: printUnpaidDto) {
    try {
      const buffer = await this.unpaidService.printUnpaid(param);
      console.log('buffer', buffer);
      res.set({
        // pdf
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename=impayes_${dayjs(
          new Date(),
        ).format('YYYYMMDD')}.pdf`,
        'Content-Length': buffer.length || 0,
        // prevent cache
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: 0,
      });
      res.end(buffer);
    } catch (error) {
      console.log('unpaid/print-controller', error);
      throw new CBadRequestException(ErrorCode.ERROR_GET_USER);
    }
  }

  /**
   *php/user/credit-balances/print.php 100%
   */
  @Get('credit-balances/print')
  @UseGuards(TokenGuard)
  async printCreditBalances(
    @Res() res: Response,
    @Query() param?: printUnpaidDto,
  ) {
    const buffer = await this.creditBalancesService.printCreditBalances(param);
    res.set({
      // pdf
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename=dossiers_crediteurs_${dayjs(
        new Date(),
      ).format('YYYYMMDD')}.pdf`,
      'Content-Length': buffer.length,
      // prevent cache
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: 0,
    });
    res.end(buffer);
  }

  /**
   *php/user/credit-balances/export.php 100%
   */
  @Get('credit-balances/export')
  @UseGuards(TokenGuard)
  async exportCreditBalances(
    @Res() res: Response,
    @Query() param: printUnpaidDto,
  ) {
    return await this.creditBalancesService.exportCreditBalances(param, res);
  }

  /**
   *php/user/unpaid/relaunch.php 100%
   */
  @Get('unpaid/relaunch')
  @UseGuards(TokenGuard)
  async relaunchUnpaid(@Query() param: printUnpaidDto) {
    return await this.unpaidService.relaunchUnpaid(param);
  }
  /**
   * File : php/user/credit-balances/index.php 100%
   * @param payload
   * @returns
   */
  @Get('credit-balances/index')
  @UseGuards(TokenGuard)
  getCreditBalances(@Query() payload: CreditBalancesDto) {
    return this.creditBalancesService.getPatientBalances(payload);
  }

  /**
   * /fsd/users/sms.php?organization_id=1 line 46
   */
  @Get('find-all-sms')
  @UseGuards(TokenGuard)
  findAll(@CurrentUser() user: UserIdentity) {
    return this.userService.findAll(user);
  }

  /**
   * /fsd/users/sms.php?organization_id=1
   * line 14-43
   */
  @Post('update-sms')
  @UseGuards(TokenGuard)
  updateSMS(@Body() users: UpdateUserSmsDto) {
    return this.userService.updateUserSms(users);
  }

  /**
   * ecoophp/fsd/users/connections.php
   */
  @Get('user-connections')
  @UseGuards(TokenGuard)
  async findLastConnectionsOfUser(
    @Query('userId') userId: number,
    @Query('page') page?: number,
    @Query('maxPerPage') maxPerPage?: number,
  ) {
    return this.userConnectionService.findLastConnectionsOfUser(
      userId,
      page,
      maxPerPage,
    );
  }
}
