import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TraceabilityService } from './services/traceability.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { TraceabilitiesRequestDto } from './dto/index.dto';

@Controller('traceability')
@ApiBearerAuth()
@ApiTags('Traceability')
export class TraceabilityController {
  constructor(private readonly traceabilityService: TraceabilityService) {}

  /**
   * php/traceabilities/index.php
   * 19 - 100
   */
  @Get()
  @UseGuards(TokenGuard)
  async getListTraceabilities(@Query() payload: TraceabilitiesRequestDto) {
    return await this.traceabilityService.getListTraceabilities(payload);
  }
}
