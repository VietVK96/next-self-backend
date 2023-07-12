import { SaveEventService } from './services/save.event.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FindEventService } from './services/find.event.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { SaveEventPayloadDto } from './dto/save.event.dto';
import { CurrentDoctor } from 'src/common/decorator/doctor.decorator';
import { EventService } from './services/event.service';
import { DeteleEventDto } from './dto/delete.event.dto';
import { SaveAgendaDto } from './dto/saveAgenda.event.dto';

@Controller('event')
@ApiTags('Event')
@ApiBearerAuth()
export class EventController {
  constructor(
    private readonly findEventService: FindEventService,
    private readonly saveEventService: SaveEventService,
    private readonly eventService: EventService,
  ) {}

  //ecoodentist-1.31.0\php\event\findAll.php full file
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

  //ecoodentist-1.31.0\php\user\preference\save.php full file
  @Post('preference/save')
  @UseGuards(TokenGuard)
  async save(
    @CurrentUser() identity: UserIdentity,
    @Body() payload: SaveEventPayloadDto,
  ) {
    return await this.saveEventService.save(identity.id, payload);
  }

  //ecoodentist-1.31.0\php\event\find.php full file
  @Get('/find/:id')
  @UseGuards(TokenGuard)
  async findById(
    @CurrentDoctor() doctorId: number,
    @CurrentUser() identity: UserIdentity,
    @Param('id') id: number,
  ) {
    return await this.findEventService.findById(doctorId, identity.org, id);
  }

  //File php/event/next.php
  @Get('/next')
  @UseGuards(TokenGuard)
  async getNextEvent(
    @Query('contact') contact?: number,
    @Query('start') start?: string,
  ) {
    return await this.findEventService.getNextEvent(contact, start);
  }

  //File php/event/previous.php
  @Get('/previous')
  @UseGuards(TokenGuard)
  async getPreviousEvent(
    @Query('contact') contact?: number,
    @Query('end') end?: string,
  ) {
    return await this.findEventService.getPreviousEvent(contact, end);
  }

  @Post('/save')
  @UseGuards(TokenGuard)
  async saveAgenda(
    @Body() payload: SaveAgendaDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.saveEventService.saveAgenda(identity.id, payload);
  }

  // php/event/delete.php -> line: 23 -> 121
  @Delete('/:id')
  @UseGuards(TokenGuard)
  async delete(
    @CurrentDoctor() doctorId: number,
    @CurrentUser() identity: UserIdentity,
    @Body() payload: DeteleEventDto,
    @Param('id') id: number,
  ) {
    return await this.eventService.detete(id, identity.org, payload);
  }
}
