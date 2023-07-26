import { Module } from '@nestjs/common';
import { PaymentSchedulesController } from './payment-schedule.controller';
import { PaymentScheduleService } from './services/payment-schedule.service';
import { PaymentPlanEntity } from 'src/entities/payment-plan.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
@Module({
  controllers: [PaymentSchedulesController],
  providers: [PaymentScheduleService],
})
export class PaymentSchedulesModule {}
