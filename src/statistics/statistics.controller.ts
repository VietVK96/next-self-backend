import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { StatisticsActsService } from './services/statistics.acts.service';
import { StatisticsEventsService } from './services/statistics.events.service';
import { FilterValuesStatisticDto } from './dto';

@ApiBearerAuth()
@ApiTags('Statistics')
@Controller('/statistics')
export class StatisticsController {
  constructor(
    private statisticsActsService: StatisticsActsService,
    private statisticsEventsService: StatisticsEventsService,
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
}
