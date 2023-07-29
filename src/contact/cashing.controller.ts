import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { CashingService } from './services/cashing.service';
import { CashingPrintDto } from './dto/cashing.dto';
import { Response } from 'express';
import { ConditionsDto } from './dto/condition.dto';
@ApiBearerAuth()
@Controller('/cashing')
@ApiTags('Cashing')
export class CashingController {
  constructor(private service: CashingService) {}

  // php/cashing/print.php
  @Get('/print')
  @UseGuards(TokenGuard)
  async print(@Res() res, @Query() payload: CashingPrintDto) {
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

  /**
   * File: php/cashing/export.php 100%
   *
   * @param queryParams
   * @param user
   * @param response
   */
  @Get('export')
  @UseGuards(TokenGuard)
  async exportCashingToCSV(
    @Query() queryParams: ConditionsDto,
    @CurrentUser() user: UserIdentity,
    @Res() response: Response,
  ) {
    // Xử lý và chuyển đổi các tham số từ URL sang định dạng phù hợp để sử dụng trong service
    // Gọi service để lấy dữ liệu dựa trên các điều kiện và userId
    const cashingsCSV = await this.service.exportPayments(
      user.id,
      queryParams.conditions,
    );

    // Xuất nội dung tệp CSV để người dùng có thể tải xuống
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="cashing.csv"',
    );
    response.send(cashingsCSV);
  }
}
