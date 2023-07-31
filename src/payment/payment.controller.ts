import {
  Controller,
  Param,
  Delete,
  UseGuards,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { Response } from 'express';
import { ConditionsDto } from './dto/condition.dto';
import * as dayjs from 'dayjs';

@ApiBearerAuth()
@ApiTags('Payment')
@Controller('payment')
@UseGuards(TokenGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * File: php/payment/delete.php 100%.
   *
   * @param id
   * @param user
   * @returns
   */
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: UserIdentity) {
    return this.paymentService.remove(+id, user);
  }

  /**
   * File : php/payment/export-ciel-win.php 100%
   */
  @Get('export_ciel_win')
  @UseGuards(TokenGuard)
  async exportCielWin(
    @Query() queryParams: ConditionsDto,
    @CurrentUser() user: UserIdentity,
    @Res() response: Response,
  ) {
    // Xử lý và chuyển đổi các tham số từ URL sang định dạng phù hợp để sử dụng trong service
    // Gọi service để lấy dữ liệu dựa trên các điều kiện và userId
    return await this.paymentService.exportCielWin(
      user.id,
      queryParams.conditions,
      response,
    );
  }

  @Get('export_ciel_mac')
  @UseGuards(TokenGuard)
  async exportCielMac(
    @Query() queryParams: ConditionsDto,
    @CurrentUser() user: UserIdentity,
    @Res() response: Response,
  ) {
    // Xử lý và chuyển đổi các tham số từ URL sang định dạng phù hợp để sử dụng trong service
    // Gọi service để lấy dữ liệu dựa trên các điều kiện và userId
    const content = await this.paymentService.exportCielMac(
      user.id,
      queryParams.conditions,
    );

    // Xử lý dữ liệu và tạo tên file dựa trên ngày hiện tại
    const currentDate = dayjs().format('YYYYMMDD');
    const filename = `${currentDate}_ecooDentist.txt`;

    // Thiết lập các thông số cho response để xuất dữ liệu dưới dạng file tệp
    response.setHeader(
      'Content-Disposition',
      `attachment; filename=${filename}`,
    );
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');

    // Gửi phản hồi với nội dung dữ liệu đã lấy từ service
    response.send(content);
  }
}
