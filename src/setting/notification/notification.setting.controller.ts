import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationSettingService } from './notification.setting.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { Request } from 'express';

@ApiBearerAuth()
@ApiTags('Setting')
@Controller('setting/notification')
export class NotificationSettingController {
  constructor(private notificationSettingService: NotificationSettingService) {}

  @Get('')
  @UseGuards(TokenGuard)
  async find(@CurrentUser() identity: UserIdentity, @Req() request: Request) {
    return await this.notificationSettingService.find(identity.id, request);
  }
}
