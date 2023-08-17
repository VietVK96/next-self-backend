import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import {
  CheckHBJDCCcamCodeDto,
  CheckHBQKCcamCodeDto,
  CheckHBMDCcamCodeDto,
} from './dto/check-ccam-code.dto';
import { CheckPriceStructDto } from './dto/event-task.dto';
import { PanachagePaniersSoinsDto } from './dto/panachage-paniers-soins.dto';
import { EventTaskService } from './services/event-task.service';

@ApiBearerAuth()
@Controller('event-task')
@ApiTags('EventTask')
export class EventTaskController {
  constructor(private eventTaskService: EventTaskService) {}

  /**
   * php/acts/exceeds-maximum-price.php
   *
   */
  @Get()
  @UseGuards(TokenGuard)
  async CheckMaximumPrice(@Query() request: CheckPriceStructDto) {
    return this.eventTaskService.checkMaximumPrice(request);
  }

  /**
   * php/patients/examen-preventions/index.php
   *
   */
  @Get('examen-preventions/:id')
  @UseGuards(TokenGuard)
  async getExamen(@Param('id') id: number) {
    return await this.eventTaskService.getExamen(id);
  }

  /**
   * php/patients/detartrages/index.php 100%
   *
   */
  @Get('detartrages/:id')
  @UseGuards(TokenGuard)
  async getDetartrages(@Param('id') id: number) {
    return await this.eventTaskService.getDetartrages(id);
  }

  /**
   * php/reglementations/43-panachage-paniers-soins.php
   */
  @Post('reglementations/43-panachage-paniers-soins/:id')
  @UseGuards(TokenGuard)
  async panachagePaniersSoins(
    @Param('id') id: number,
    @Body() payload: PanachagePaniersSoinsDto,
  ) {
    return await this.eventTaskService.panachagePaniersSoins(id, payload);
  }

  /**
   * php/event/task/checkHBJDCcamCode.php
   *
   */
  @Get('check-HBJDC-cam-code/:id')
  @UseGuards(TokenGuard)
  async checkHBJDCcamCode(
    @Param('id') id: number,
    @Query() payload: CheckHBJDCCcamCodeDto,
  ) {
    return await this.eventTaskService.checkHBJDCcamCode(id, payload);
  }

  /**
   * php/event/task/checkHBQKCcamCode.php
   *
   */
  @Get('check-HBJD-ccam-code/:id')
  @UseGuards(TokenGuard)
  async checkHBQKCcamCode(
    @Param('id') id: number,
    @Query() payload: CheckHBQKCcamCodeDto,
  ) {
    return await this.eventTaskService.checkHBQKCcamCode(id, payload);
  }

  /**
   * php/event/task/checkHBMDCcamCode.php
   *
   */
  @Get('check-HBMD-ccam-code/:id')
  @UseGuards(TokenGuard)
  async checkHBMDCcamCode(
    @Param('id') id: number,
    @Query() payload: CheckHBMDCcamCodeDto,
  ) {
    return await this.eventTaskService.checkHBMDCcamCode(id, payload);
  }
}
