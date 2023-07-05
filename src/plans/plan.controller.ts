import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import {
  DuplicatePlanDto,
  FindAllStructDto,
  IdStructDto,
} from './dto/plan.dto';
import { PlanService } from './services/plan.service';

@ApiBearerAuth()
@Controller('/contact/plan/all')
@ApiTags('Plan')
export class PlanController {
  constructor(private PlanService: PlanService) {}

  // File /php/contact/plans/findAll.php
  @Get()
  @UseGuards(TokenGuard)
  async findAll(@Query() request: FindAllStructDto) {
    return this.PlanService.findAll(request);
  }

  @Delete()
  @UseGuards(TokenGuard)
  async deleteOne(
    @Query() request: IdStructDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.PlanService.deleteOne(request, identity);
  }

  @Get('/get')
  @UseGuards(TokenGuard)
  async findOne(
    @Query() request: IdStructDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.PlanService.findOne(request, identity.org);
  }

  /**
   * php/plan/duplicate.php
   * Duplication d'un plan de traitement.
   */
  @Post('/duplicate')
  @UseGuards(TokenGuard)
  async duplicate(
    @Body() request: DuplicatePlanDto,
    @CurrentUser() identity: UserIdentity,
  ): Promise<{
    events: import('d:/Project/VFR/backend/src/entities/event.entity').EventEntity[];
    organizationId: number;
    userId: number;
    patientId: number;
    name: string;
    type: import('d:/Project/VFR/backend/src/entities/plan-plf.entity').EnumPlanPlfType;
    amount: number;
    mutualCeiling: number;
    personRepayment: number;
    personAmount: number;
    acceptedOn: string;
    id?: number;
    bilId?: number;
    bill?: import('d:/Project/VFR/backend/src/entities/bill.entity').BillEntity;
    user?: import('d:/Project/VFR/backend/src/entities/user.entity').UserEntity;
    patient?: import('d:/Project/VFR/backend/src/entities/contact.entity').ContactEntity;
    sentToPatient?: number;
    sendingDateToPatient?: string;
    organization?: import('d:/Project/VFR/backend/src/entities/organization.entity').OrganizationEntity;
    paymentScheduleId?: number;
    paymentSchedule?: import('d:/Project/VFR/backend/src/entities/payment-plan.entity').PaymentPlanEntity;
    createdAt?: Date;
    updatedAt?: Date;
  }> {
    return this.PlanService.duplicate(request, identity?.org);
  }
}
