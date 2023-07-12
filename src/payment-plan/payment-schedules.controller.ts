import { Body, Controller, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { PaymentPlanService } from './services/payment-plan.service';
import { identity } from 'rxjs';
import { PaymentSchedulesDto } from './dto/payment.dto';
@ApiBearerAuth()
@Controller('/payment-schedules')
@ApiTags('Payment Schedules')
export class PaymentSchedulesController {
  constructor(private service: PaymentPlanService) {}

  // php/payment-schedules/store.php
  @Post('/store')
  @UseGuards(TokenGuard)
  async store(
    @Body() payload: PaymentSchedulesDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.service.store(payload, identity);
  }
}
