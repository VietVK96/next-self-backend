import { Module } from '@nestjs/common';
import { PaymentSchedulesController } from './payment-schedule.controller';
import { PaymentScheduleService } from './services/payment-schedule.service';
@Module({
  controllers: [PaymentSchedulesController],
  providers: [PaymentScheduleService],
})
export class PaymentSchedulesModule {}
