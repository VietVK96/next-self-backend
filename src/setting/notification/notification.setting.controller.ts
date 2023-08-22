import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationSettingService } from './notification.setting.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { Request } from 'express';
import { SaveMessageNotificationDto } from './dto/saveMessage.notification.dto';
import { SaveSmsShareDto } from './dto/notification.dto';

@ApiBearerAuth()
@ApiTags('Setting')
@Controller('setting/notification')
export class NotificationSettingController {
  constructor(private notificationSettingService: NotificationSettingService) {}

  @Get('')
  @UseGuards(TokenGuard)
  async find(
    @CurrentUser() identity: UserIdentity,
    @Req() request: Request,
    @Headers('host') host: string,
  ) {
    return await this.notificationSettingService.find(
      identity.id,
      request,
      host,
    );
  }

  @Get('message')
  @UseGuards(TokenGuard)
  async findMessage(@CurrentUser() identity: UserIdentity) {
    return await this.notificationSettingService.findMessage(identity.id);
  }

  @Post('message')
  @UseGuards(TokenGuard)
  async saveMessage(
    @CurrentUser() identity: UserIdentity,
    @Body() payload: SaveMessageNotificationDto,
  ) {
    return await this.notificationSettingService.saveMessage(
      identity.id,
      payload,
    );
  }

  @Post()
  @UseGuards(TokenGuard)
  async saveSmsShare(
    @CurrentUser() identity: UserIdentity,
    @Body() payload: SaveSmsShareDto,
  ) {
    return await this.notificationSettingService.saveSmsShare(
      identity.org,
      payload,
    );
  }
}
