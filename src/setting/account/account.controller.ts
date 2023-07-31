import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccountService } from './services/account.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { UpdateMyInformationDto } from './dto/updateMyInformation.account.res';

@ApiBearerAuth()
@ApiTags('Setting')
@Controller('setting/account')
export class AccounController {
  constructor(private accountService: AccountService) {}

  // settings/account/index.php
  @Get('')
  @UseGuards(TokenGuard)
  async find(@CurrentUser() identity: UserIdentity) {
    return this.accountService.find(identity.id);
  }

  // settings/account/my-information.php
  @Get('my-information')
  @UseGuards(TokenGuard)
  async findMyInformation(@CurrentUser() identity: UserIdentity) {
    return await this.accountService.findMyInformation(identity.id);
  }

  // settings/account/my-information.php
  @Post('my-information')
  // @UseGuards(TokenGuard)
  async updateMyInformation(
    @Body() payload: UpdateMyInformationDto,
    // @CurrentUser() identity: UserIdentity,
  ) {
    return await this.accountService.updateMyInformation(3, payload);
  }
}
