import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { UserPreferenceService } from './services/user-preference.service';
import {
  TokenGuard,
  CurrentUser,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';

@ApiTags('UserPreference')
@Controller('user-preference')
@ApiBearerAuth()
export class UserPreferenceController {
  constructor(private userPreferenceService: UserPreferenceService) {}

  @Get()
  @UseGuards(TokenGuard)
  async getByUser(@CurrentUser() identity: UserIdentity) {
    return await this.userPreferenceService.getByUser(identity.id);
  }
}
