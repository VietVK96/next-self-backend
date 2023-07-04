import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanEntity } from 'src/entities/plan.entity';
import { PlanController } from './plan.controller';
import { PlanService } from './services/plan.service';
import { PaymentPlanService } from 'src/payment-plan/services/payment-plan.service';
import { PermissionService } from 'src/user/services/permission.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlanEntity])],
  controllers: [PlanController],
  providers: [PlanService, PaymentPlanService, PermissionService],
})
export class PlanModule {}
