import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccountSettingService } from './account.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { UpdateMyInformationDto } from './dto/updateMyInformation.account.dto';

@ApiBearerAuth()
@ApiTags('Setting')
@Controller('setting/account')
export class AccounSettingController {
  constructor(private accountService: AccountSettingService) {}

  // settings/account/index.php
  @Get('')
  @UseGuards(TokenGuard)
  async find(@CurrentUser() identity: UserIdentity) {
    return await this.accountService.find(identity.id);
  }

  // settings/account/my-information.php
  @Get('my-information')
  @UseGuards(TokenGuard)
  async findMyInformation(@CurrentUser() identity: UserIdentity) {
    return await this.accountService.findMyInformation(identity.id);
  }

  // settings/account/my-information.php
  @Post('my-information')
  @UseGuards(TokenGuard)
  async updateMyInformation(
    @Body() payload: UpdateMyInformationDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return await this.accountService.updateMyInformation(identity.id, payload);
  }
}
