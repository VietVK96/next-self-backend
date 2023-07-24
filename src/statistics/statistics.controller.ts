import { Controller, Body, Post, UseGuards, Get, Query } from '@nestjs/common';

import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { StatisticsPaymentService } from './services/statistics.payment.service';
import { StatisticsPaymentDto } from './dto/statistics.payment.dto';
import { StatisticsPatientService } from './services/statistics.patient.service';

@ApiBearerAuth()
@ApiTags('Statistics') // Thêm nhãn API nếu cần thiết
@Controller('statistics') // Đặt lại đường dẫn tùy ý tương ứng với tên controller của bạn
export class StatisticsController {
  constructor(
    private statisticsPaymentService: StatisticsPaymentService,
    private statisticsPatientService: StatisticsPatientService,
  ) {}

  /**
   * File php/statistics/payments/sales-revenues.php
   * Line 9 -> 36
   */
  @Get('payment/sales-revenues')
  @UseGuards(TokenGuard)
  async paymentSalesRevenues(
    @CurrentUser() user: UserIdentity,
    @Query() param: StatisticsPaymentDto,
  ) {
    return this.statisticsPaymentService.paymentSalesRevenues(param);
  }

  /**
   * File php/statistics/payments/receipts-by-types.php
   * Line 9 -> 37
   */
  @Get('payment/receipts-by-types')
  @UseGuards(TokenGuard)
  async paymentReceiptsByType(
    @CurrentUser() user: UserIdentity,
    @Query() param: StatisticsPaymentDto,
  ) {
    return this.statisticsPaymentService.paymentReceiptsByType(param);
  }

  /**
   * File php/statistics/payments/receipts-by-choices.php
   * Line 9 -> 50
   */
  @Get('payment/receipts-by-choices')
  @UseGuards(TokenGuard)
  async paymentReceiptsByChoices(
    @CurrentUser() user: UserIdentity,
    @Query() param: StatisticsPaymentDto,
  ) {
    return this.statisticsPaymentService.paymentReceiptsByChoices(param);
  }

  /**
   * File php/statistics/patients/index.php
   * Line 15 -> 71
   */
  @Get('patient/index')
  @UseGuards(TokenGuard)
  async patientIndex(
    @CurrentUser() user: UserIdentity,
    @Query() param: StatisticsPaymentDto,
  ) {
    return this.statisticsPatientService.patientIndex(param, user);
  }

  /**
   * File php/statistics/patients/new.php
   * Line 15 -> 35
   */
  @Get('patient/new')
  @UseGuards(TokenGuard)
  async patientNew(@Query() param: StatisticsPaymentDto) {
    return this.statisticsPatientService.patientNew(param);
  }

  /**
   * File /php/statistics/patients/children.php
   * Line 9 -> 47
   */
  @Get('patient/children')
  @UseGuards(TokenGuard)
  async patientChildren(@Query() param: StatisticsPaymentDto) {
    return this.statisticsPatientService.patientChildren(param);
  }

  /**
   * File php/statistics/patients/average.php
   * Line 9 -> 45
   */
  @Get('patient/average')
  @UseGuards(TokenGuard)
  async patientAverage(@Query() param: StatisticsPaymentDto) {
    return this.statisticsPatientService.patientAverage(param);
  }
}
