import { EventTypeService } from './services/event-type.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import {
  CreateEventTypeDto,
  DuplicateEventTypeDto,
  UpdateEventTypeDto,
} from './dto/event-type.tdo';

@Controller('event-type')
@ApiTags('Event Type')
@ApiBearerAuth()
export class EventTypeController {
  constructor(private readonly eventTypeService: EventTypeService) {}

  //settings/library/event-types/index.php
  @Get()
  @UseGuards(TokenGuard)
  async getAll(@CurrentUser() identity: UserIdentity) {
    return await this.eventTypeService.findAll(identity.id);
  }

  //settings/library/event-types/store.php
  @Post()
  @UseGuards(TokenGuard)
  async create(
    @CurrentUser() identity: UserIdentity,
    @Body() payload: CreateEventTypeDto,
  ) {
    return await this.eventTypeService.create(
      identity.id,
      identity.org,
      payload,
    );
  }

  @Post('/copy')
  @UseGuards(TokenGuard)
  async duplicate(
    @CurrentUser() identity: UserIdentity,
    @Body() payload: DuplicateEventTypeDto,
  ) {
    return await this.eventTypeService.duplicate(identity.id, payload);
  }

  @Put('/:id')
  @UseGuards(TokenGuard)
  async update(@Param('id') id: number, @Body() payload: UpdateEventTypeDto) {
    return await this.eventTypeService.update(id, payload);
  }

  @Delete('/:id')
  @UseGuards(TokenGuard)
  async delete(@Param('id') id: number) {
    return await this.eventTypeService.delete(id);
  }
}
