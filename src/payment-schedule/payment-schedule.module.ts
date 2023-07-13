import { Module } from '@nestjs/common';
import { PaymentSchedulesController } from './payment-schedule.controller';
import { PaymentPlanService } from './services/payment-schedule.service';
@Module({
  controllers: [PaymentSchedulesController],
  providers: [PaymentPlanService],
})
export class PaymentSchedulesModule {}
