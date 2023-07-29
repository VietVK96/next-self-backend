import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanEntity } from 'src/entities/plan.entity';
import { PlanController } from './plan.controller';
import { PlanService } from './services/plan.service';
import { PaymentScheduleService } from 'src/payment-schedule/services/payment-schedule.service';
import { PermissionService } from 'src/user/services/permission.service';
import { PlanPlfEntity } from 'src/entities/plan-plf.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlanEntity, PlanPlfEntity])],
  controllers: [PlanController],
  providers: [PlanService, PaymentScheduleService, PermissionService],
})
export class PlanModule {}
