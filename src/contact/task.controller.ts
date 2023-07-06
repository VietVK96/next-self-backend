import { SaveTaskService } from './services/save.task.service';
import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { TaskService } from './services/task.service';
import {
  EventTaskDto,
  EventTaskPatchDto,
  EventTaskSaveDto,
} from './dto/task.contact.dto';

@ApiBearerAuth()
@Controller('/event')
@ApiTags('Event')
export class TaskController {
  constructor(
    private taskService: TaskService,
    private saveTaskService: SaveTaskService,
  ) {}

  /**
   * php/event/task/unrealized.php
   *
   */

  @Patch('task')
  @UseGuards(TokenGuard)
  async updateEventTask(@Body() payload: EventTaskDto) {
    return await this.taskService.updateEventTask(payload);
  }

  @Post('task/patch')
  @UseGuards(TokenGuard)
  async updateEventTaskPatch(@Body() payload: EventTaskPatchDto) {
    return await this.taskService.updateEventTaskPatch(payload);
  }
  /**
   * php\event\task\unrealized.php line 1->12
   */
  @Patch('task/realized')
  @UseGuards(TokenGuard)
  async realizeEventTask(
    @Body() payload: EventTaskDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return await this.taskService.realizeEventTask(payload, identity);
  }

  @Post('task/save')
  // @UseGuards(TokenGuard)
  async saveEventTask(@Body() payload: EventTaskSaveDto) {
    return this.saveTaskService.save(payload);
  }
}
