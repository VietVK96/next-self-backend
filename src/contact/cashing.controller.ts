import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { CashingService } from './services/cashing.service';
import { CashingPrintDto } from './dto/cashing.dto';
@ApiBearerAuth()
@Controller('/cashing')
@ApiTags('Cashing')
export class CashingController {
  constructor(private service: CashingService) {}

  // php/cashing/print.php
  @Get('/print')
  @UseGuards(TokenGuard)
  async print(
    @Res() res,
    @Query() payload: CashingPrintDto,
    // @CurrentUser() identity: UserIdentity,
  ) {
    const buffer = await this.service.print(payload);

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
