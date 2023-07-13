import { Module } from '@nestjs/common';
import { PaymentSchedulesController } from './payment-schedules.controller';
import { PaymentPlanService } from './services/payment-plan.service';
@Module({
  controllers: [PaymentSchedulesController],
  providers: [PaymentPlanService],
})
export class PaymentSchedulesModule {}
