import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { StatisticsActsService } from './services/statistics.acts.service';
import { StatisticsEventsService } from './services/statistics.events.service';
import { FilterValuesStatisticDto } from './dto';
import { StatisticsPaymentService } from './services/statistics.payment.service';
import { StatisticsPatientService } from './services/statistics.patient.service';
import { StatisticsXrayGatewayService } from './services/statistics.xray-gateway.service';
import { Request } from 'express';

@ApiBearerAuth()
@ApiTags('Statistics')
@Controller('/statistics')
export class StatisticsController {
  constructor(
    private statisticsActsService: StatisticsActsService,
    private statisticsEventsService: StatisticsEventsService,
    private statisticsPaymentService: StatisticsPaymentService,
    private statisticsPatientService: StatisticsPatientService,
    private statisticsXrayGatewayService: StatisticsXrayGatewayService,
  ) {}

  @Get('/acts/caresheets')
  @UseGuards(TokenGuard)
  async getCareSheets(@Query() request: FilterValuesStatisticDto) {
    return this.statisticsActsService.getCareSheets(request);
  }

  @Get('/acts/ccam-families')
  @UseGuards(TokenGuard)
  async getCCamFamilies(@Query() request: FilterValuesStatisticDto) {
    return this.statisticsActsService.getCCamFamilies(request);
  }

  @Get('/events/obtaining-delay')
  @UseGuards(TokenGuard)
  async getEventsObtainingDelay(@Query() request: FilterValuesStatisticDto) {
    return this.statisticsEventsService.getEventsObtainingDelay(request);
  }

  @Get('/events/productivity')
  @UseGuards(TokenGuard)
  async getProductivity(@Query() request: FilterValuesStatisticDto) {
    return this.statisticsEventsService.getProductivity(request);
  }

  @Get('/events/emergencies')
  @UseGuards(TokenGuard)
  async getEmergencies(@Query() request: FilterValuesStatisticDto) {
    return this.statisticsEventsService.getEmergencies(request);
  }

  @Get('/events/reliability')
  @UseGuards(TokenGuard)
  async getReliability(@Query() request: FilterValuesStatisticDto) {
    return this.statisticsEventsService.getReliability(request);
  }

  @Get('/events/occupancy-rate')
  @UseGuards(TokenGuard)
  async getOccupancyRate(@Query() request: FilterValuesStatisticDto) {
    return this.statisticsEventsService.getOccupancyRate(request);
  }

  /**
   * File php/statistics/payments/sales-revenues.php
   * Line 9 -> 36
   */
  @Get('payment/sales-revenues')
  @UseGuards(TokenGuard)
  async paymentSalesRevenues(@Query() param: FilterValuesStatisticDto) {
    return this.statisticsPaymentService.paymentSalesRevenues(param);
  }

  /**
   * File php/statistics/payments/receipts-by-types.php
   * Line 9 -> 37
   */
  @Get('payment/receipts-by-types')
  @UseGuards(TokenGuard)
  async paymentReceiptsByType(@Query() param: FilterValuesStatisticDto) {
    return this.statisticsPaymentService.paymentReceiptsByType(param);
  }

  /**
   * File php/statistics/payments/receipts-by-choices.php
   * Line 9 -> 50
   */
  @Get('payment/receipts-by-choices')
  @UseGuards(TokenGuard)
  async paymentReceiptsByChoices(@Query() param: FilterValuesStatisticDto) {
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
    @Query() param: FilterValuesStatisticDto,
  ) {
    return this.statisticsPatientService.patientIndex(param, user);
  }

  /**
   * File php/statistics/patients/new.php
   * Line 15 -> 35
   */
  @Get('patient/new')
  @UseGuards(TokenGuard)
  async patientNew(@Query() param: FilterValuesStatisticDto) {
    return this.statisticsPatientService.patientNew(param);
  }

  /**
   * File /php/statistics/patients/children.php
   * Line 9 -> 47
   */
  @Get('patient/children')
  @UseGuards(TokenGuard)
  async patientChildren(@Query() param: FilterValuesStatisticDto) {
    return this.statisticsPatientService.patientChildren(param);
  }

  /**
   * File php/statistics/patients/average.php
   * Line 9 -> 45
   */
  @Get('patient/average')
  @UseGuards(TokenGuard)
  async patientAverage(@Query() param: FilterValuesStatisticDto) {
    return this.statisticsPatientService.patientAverage(param);
  }

  /**
   * File php/statistics/xray-gateways/store.php
   */
  @Post('xray-gateways')
  @UseGuards(TokenGuard)
  async storeXrayGateways(
    @CurrentUser() identity: UserIdentity,
    @Req() req: Request,
    @Body() body: { name: string },
  ) {
    // console.log(req.headers['user-agent'])
    return this.statisticsXrayGatewayService.storeXrayGateways(
      identity,
      req,
      body.name,
    );
  }
}
