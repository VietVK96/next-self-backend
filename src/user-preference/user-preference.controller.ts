import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { UserPreferenceService } from './services/user-preference.service';
import {
  TokenGuard,
  CurrentUser,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { UpdateUserPreferenceDto } from './dto/user-preference.dto';

@ApiTags('UserPreference')
@Controller('user-preference')
@ApiBearerAuth()
export class UserPreferenceController {
  constructor(private userPreferenceService: UserPreferenceService) {}

  //settings/account/preference.php
  //all line
  @Get()
  @UseGuards(TokenGuard)
  async getByUser(@CurrentUser() identity: UserIdentity) {
    return await this.userPreferenceService.getByUser(identity.id);
  }

  @Put()
  @UseGuards(TokenGuard)
  async update(
    @CurrentUser() identity: UserIdentity,
    @Body() body: UpdateUserPreferenceDto,
  ) {
    return await this.userPreferenceService.update(
      identity.id,
      body,
      identity.org,
    );
  }
}
