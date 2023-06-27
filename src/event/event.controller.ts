import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FindEventService } from './services/find.event.services';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';

@Controller('event')
@ApiTags('Event')
@ApiBearerAuth()
export class EventController {
  constructor(private readonly findEventService: FindEventService) {}

  @Get()
  @UseGuards(TokenGuard)
  async findAll(
    @Query('resources') resources: number[],
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('viewCancelledEvents') viewCancelledEvents: number,
    @Query('confidentiality') confidentiality?: number,
  ) {
    return await this.findEventService.findAll(
      resources,
      startDate,
      endDate,
      viewCancelledEvents,
      confidentiality,
    );
  }
}
