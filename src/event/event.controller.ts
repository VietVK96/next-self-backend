import { SaveEventService } from './services/save.event.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
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
import { PrintReq } from './dto/printEvent.dto';
import type { Response } from 'express';

@Controller('event')
@ApiTags('Event')
@ApiBearerAuth()
export class EventController {
  constructor(
    private readonly findEventService: FindEventService,
    private readonly saveEventService: SaveEventService,
    private readonly eventService: EventService,
  ) {}

  // php/event/findAll.php full file
  @Get()
  @UseGuards(TokenGuard)
  async findAll(
    @Query('resources') resources: number[],
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('viewCancelledEvents') viewCancelledEvents?: number,
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

  // php/user/preference/save.php full file
  @Post('preference/save')
  @UseGuards(TokenGuard)
  async save(
    @CurrentUser() identity: UserIdentity,
    @Body() payload: SaveEventPayloadDto,
  ) {
    return await this.saveEventService.save(identity.id, payload);
  }

  // php/event/find.php full file
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
    @CurrentDoctor() doctorId: number,
  ) {
    return this.saveEventService.saveAgenda(identity.id, payload, doctorId);
  }

  // php/event/delete.php -> line: 23 -> 121
  @Delete('/:id')
  @UseGuards(TokenGuard)
  async delete(
    @CurrentUser() identity: UserIdentity,
    @Body() payload: DeteleEventDto,
    @Param('id') id: number,
  ) {
    return await this.eventService.detete(id, identity.org, payload);
  }

  /**
   * php/event/print-planning.php + php/event/print-planningnotes.php
   */
  @Get('/print/planning')
  @UseGuards(TokenGuard)
  async printPlanning(@Res() res: Response, @Query() param: PrintReq) {
    const buffer = await this.findEventService.printPlanning(param);
    res.set({
      // pdf
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=print.pdf`,
      'Content-Length': buffer.length,
      // prevent cache
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: 0,
    });
    res.end(buffer);
  }

  /**
   * php/event/print-calendar.php
   */
  @Get('print/calendar')
  @UseGuards(TokenGuard)
  async printCalendar(
    @Res() res: Response,
    @Query() param: PrintReq,
    @CurrentUser() identity: UserIdentity,
  ) {
    const buffer = await this.findEventService.printCalendar(
      param,
      identity.id,
    );
    res.set({
      // pdf
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=print.pdf`,
      'Content-Length': buffer.length,
      // prevent cache
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: 0,
    });
    res.end(buffer);
  }

  @Get('export')
  @UseGuards(TokenGuard)
  /**
   * php/event/export.php
   */
  async export(
    @Res() res: Response,
    @Query('resources') resources: number[],
    @Query('datetime1') datetime1: string,
    @Query('datetime2') datetime2: string,
    @Query('format') format: string,
    @Query('range') range: number,
  ) {
    return await this.eventService.export(
      res,
      resources,
      datetime1,
      datetime2,
      format,
      range,
    );
  }
}
