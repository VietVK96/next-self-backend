import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { ReminderVisitService } from './services/reminderVisit.service';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import {
  ReminderVisitMailDto,
  ReminderVisitPrintQuery,
  ReminderVisitQuery,
  ReminderVisitSmsDto,
} from './dto/reminderVisit.dto';
import { ReminderVisitRes } from './response/reminder-visit.res';
import { TokenDownloadGuard } from 'src/common/decorator/token-download.decorator';

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

  /**
   * php/contact/reminderVisit/print.php
   * 15-300
   */
  @Get('/print')
  @UseGuards(TokenDownloadGuard)
  async print(
    @Res() res: Response,
    @CurrentUser() identity: UserIdentity,
    @Query() params: ReminderVisitPrintQuery,
  ) {
    const buffer = await this.reminderVisitService.print(
      identity.id,
      identity.org,
      params,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename=document.pdf`,
      'Content-Length': buffer?.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: 0,
    });
    res.end(buffer);
  }

  /**
   * php/contact/reminderVisit/mail.php
   * full file
   */
  @Get('/mail')
  @UseGuards(TokenGuard)
  async mail(@Query() payload: ReminderVisitMailDto) {
    return await this.reminderVisitService.mail(payload);
  }

  /**
   * php/contact/reminderVisit/sms.php
   */
  @Post('/sms')
  @UseGuards(TokenGuard)
  async sms(@Body() payload: ReminderVisitSmsDto) {
    return await this.reminderVisitService.sendReminderSMS(payload);
  }

  /**
   * php/contact/reminderVisit/email.php
   */
  @Post('/email')
  @UseGuards(TokenGuard)
  async email(@Body() payload: ReminderVisitSmsDto) {
    return await this.reminderVisitService.sendReminderEmail(payload);
  }
}
