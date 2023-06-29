import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { TaskService } from './services/task.service';
import { EventTaskDto } from './dto/task.contact.dto';

@ApiBearerAuth()
@Controller('/event')
@ApiTags('Event')
export class TaskController {
  constructor(private taskService: TaskService) {}

  /**
   * php/event/task/unrealized.php
   *
   */

  @Patch('task')
  @UseGuards(TokenGuard)
  async updateEventTask(@Body() payload: EventTaskDto) {
    return await this.taskService.updateEventTask(payload);
  }
}
