import { Controller, Param, Delete, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';

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
}
