import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EmailSettingService } from './services/email.setting.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';

@ApiBearerAuth()
@ApiTags('Setting')
@Controller('setting/email')
export class EmailSettingController {
  constructor(private emailSettingService: EmailSettingService) {}

  @Get('')
  @UseGuards(TokenGuard)
  async find(@CurrentUser() identity: UserIdentity) {
    return await this.emailSettingService.find(identity.id);
  }

  // @Get('create')
  // @UseGuards(TokenGuard)
  // async create(@CurrentUser() identity: UserIdentity) {}
}
