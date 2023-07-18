import {
  Body,
  Controller,
  Delete,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { PaymentScheduleService } from './services/payment-schedule.service';
import {
  PaymentSchedulesDto,
  PaymentSchedulesParamDto,
} from './dto/payment.dto';
@ApiBearerAuth()
@Controller('/payment-schedule')
@ApiTags('Payment Schedule')
export class PaymentSchedulesController {
  constructor(private service: PaymentScheduleService) {}

  // php/payment-schedules/store.php
  @Post('/store')
  @UseGuards(TokenGuard)
  async store(
    @Body() payload: PaymentSchedulesDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.service.store(payload, identity);
  }

  // php/payment-schedules/store.php
  @Delete()
  @UseGuards(TokenGuard)
  async delete(
    @Query() payload: PaymentSchedulesParamDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.service.delete(payload.id, identity.org);
  }
}
