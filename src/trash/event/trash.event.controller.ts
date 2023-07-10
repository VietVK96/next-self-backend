import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TrashEventService } from './service/trash.event.service';
import { CurrentDoctor } from 'src/common/decorator/doctor.decorator';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';

@Controller('trash/event')
@ApiBearerAuth()
@ApiTags('Trash/Event')
export class TrashEventController {
  constructor(private readonly trashEventService: TrashEventService) {}

  @Get()
  @UseGuards(TokenGuard)
  async findAll(
    @CurrentDoctor() doctorId: number,
    @Query('start') start: number,
    @Query('length') length: number,
  ) {
    return this.trashEventService.findAll(doctorId, start, length);
  }

  @Post()
  @UseGuards(TokenGuard)
  async restore(
    @CurrentUser() identity: UserIdentity,
    @Body() payload: number[],
  ) {
    return this.trashEventService.restore(identity.org, payload);
  }
}
