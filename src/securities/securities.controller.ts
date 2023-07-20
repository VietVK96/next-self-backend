import { Controller, Body, Post, UseGuards } from '@nestjs/common';

import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SecuritiesService } from './securities.service';
import { VerifyPasswordDto } from './dto/veiry-password.dto';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';

@ApiBearerAuth()
@ApiTags('Securities') // Thêm nhãn API nếu cần thiết
@Controller('securities') // Đặt lại đường dẫn tùy ý tương ứng với tên controller của bạn
export class SecuritiesController {
  constructor(private securituesService: SecuritiesService) {}

  /**
   * File php: php/securities/password-accounting/verify.php from line 22 to line 31.
   * Verify the password matches
   */
  @UseGuards(TokenGuard)
  @Post('verify-password')
  @ApiResponse({ status: 200, description: 'Password verified: true' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  verifyPassword(
    @Body() verifyPassWordDto: VerifyPasswordDto,
    @CurrentUser() user: UserIdentity,
  ) {
    return this.securituesService.verifyPassword(verifyPassWordDto, user);
  }
}
