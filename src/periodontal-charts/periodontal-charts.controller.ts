import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { PeriodontalChartsService } from './services/periodontal-charts.service';
import { IndexDto, ShowDto } from './dto/periodontal-charts.dto';

@ApiBearerAuth()
@Controller('periodontal-charts')
@ApiTags('Periodontal-charts')
export class PeriodontalChartsController {
  constructor(private periodontalChartsService: PeriodontalChartsService) {}

  // File php/periodontal-charts/index.php
  @Get('/index')
  @UseGuards(TokenGuard)
  async findAll(
    // @Query() patient_id: number
    @Query() payload: IndexDto,
  ) {
    return this.periodontalChartsService.index(payload?.patient_id);
  }

  @Get('/show')
  @UseGuards(TokenGuard)
  async show(@Query() payload: ShowDto) {
    return this.periodontalChartsService.show(payload?.id);
  }
}
