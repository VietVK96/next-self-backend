import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EmailSettingService } from './services/email.setting.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { SaveEmailDto } from './dto/saveEmail.setting.dto';

@ApiBearerAuth()
@ApiTags('Setting')
@Controller('setting/email')
export class EmailSettingController {
  constructor(private emailSettingService: EmailSettingService) {}

  // settings/email-accounts/index.php
  @Get('')
  @UseGuards(TokenGuard)
  async find(@CurrentUser() identity: UserIdentity) {
    return await this.emailSettingService.find(identity.id);
  }

  @Get('/:id')
  @UseGuards(TokenGuard)
  async findById(@Param('id') id: number) {
    return await this.emailSettingService.findById(id);
  }

  // settings/email-accounts/create.php
  @Post('create')
  @UseGuards(TokenGuard)
  async create(
    @CurrentUser() identity: UserIdentity,
    @Body() payload: SaveEmailDto,
  ) {
    return await this.emailSettingService.create(
      identity.id,
      identity.org,
      payload,
    );
  }

  // settings/email-accounts/edit.php
  @Post('edit/:id')
  @UseGuards(TokenGuard)
  async edit(@CurrentUser() identity: UserIdentity) {
    //  return await this.emailSettingService.edit(identity.id, identity.org);
  }
}
