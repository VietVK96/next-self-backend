import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { CheckPriceStructDto } from './dto/event-task.dto';
import { EventTaskService } from './services/event-task.service';

@ApiBearerAuth()
@Controller('event-task')
@ApiTags('EventTask')
export class EventTaskController {
  constructor(private eventTaskService: EventTaskService) {}

  @Get()
  @UseGuards(TokenGuard)
  async CheckMaximumPrice(@Query() request: CheckPriceStructDto) {
    return this.eventTaskService.CheckMaximumPrice(request);
  }
}
