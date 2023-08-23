import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { ContactPdfService } from './services/contact.pdf.service';
import { ContactPdfDto } from './dto/contact.pdf.dto';

@ApiBearerAuth()
@Controller('/contact')
@ApiTags('Contact')
export class ContactPdfController {
  constructor(private contactPdfService: ContactPdfService) {}

  // File: php/contact/appointment/print.php
  @Get('appointment/print')
  @UseGuards(TokenGuard)
  async getContactAppointmentPdf(
    @Res() res: Response,
    @CurrentUser() identity: UserIdentity,
    @Query('id') id?: number,
    @Query('nextEvents') nextEvents?: number,
  ) {
    const buffer = await this.contactPdfService.getContactAppointmentPdf(
      id,
      nextEvents,
      identity,
    );
    res.set({
      // pdf
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=print.pdf`,
      'Content-Length': buffer.length,
      // prevent cache
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: 0,
    });
    res.end(buffer);
  }

  /**
   * File dental/fs/fs_verso_pdf.php
   * Line 16 -> 194
   */
  @Get('fs-verso-pdf/print')
  @UseGuards(TokenGuard)
  async getFsVersoPdf(
    @Res() res: Response,
    @CurrentUser() identity: UserIdentity,
    @Query('person') person?: number,
  ) {
    const buffer = await this.contactPdfService.getFsVersoPdf(person, identity);
    res.set({
      // pdf
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=print.pdf`,
      'Content-Length': buffer.length,
      // prevent cache
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: 0,
    });
    res.end(buffer);
  }

  /**
   * File: php/contact/print.php
   */
  @Get('print')
  @UseGuards(TokenGuard)
  async getContactPdf(
    @Res() res: Response,
    @CurrentUser() identity: UserIdentity,
    @Query() param?: ContactPdfDto,
  ) {
    const buffer = await this.contactPdfService.getContactPdf(param);
    res.set({
      // pdf
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=print.pdf`,
      'Content-Length': buffer.length,
      // prevent cache
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: 0,
    });
    res.end(buffer);
  }
}
