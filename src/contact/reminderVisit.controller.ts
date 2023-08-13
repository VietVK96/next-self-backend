import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { ReminderVisitService } from './services/reminderVisit.service';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { ReminderVisitQuery } from './dto/reminderVisit.dto';
import { ReminderVisitRes } from './response/reminder-visit.res';

@ApiBasicAuth()
@Controller('/reminder-visit')
@ApiTags('ReminderVisit')
export class ReminderVisitController {
  constructor(private reminderVisitService: ReminderVisitService) {}

  /**
   * php/contact/reminderVisit/findAll.php
   * 17-247
   */
  @Get('')
  @UseGuards(TokenGuard)
  async getAll(
    @CurrentUser() identity: UserIdentity,
    @Query() params: ReminderVisitQuery,
  ): Promise<ReminderVisitRes> {
    return await this.reminderVisitService.getAll(
      identity.id,
      identity.org,
      params,
    );
  }
}
