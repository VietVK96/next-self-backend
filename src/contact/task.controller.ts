import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { TaskService } from './services/task.service';
import { EventTaskDto, EventTaskPatchDto } from './dto/task.contact.dto';

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

  @Post('/task/patch')
  @UseGuards(TokenGuard)
  async updateTaskPatch(@Body() payload: EventTaskPatchDto) {
    console.log('updateTaskPatch', payload);
    return await this.taskService.updateTaskPatch(payload);
  }
}
