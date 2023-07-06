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
import { TimeslotsService } from './services/timeslots.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { CreateTimeslotPayloadDto } from './dto/create.timeslots.dto';

@Controller('timeslots')
@ApiBearerAuth()
@ApiTags('Timeslots')
export class TimeslotController {
  constructor(private readonly timeslotsService: TimeslotsService) {}

  @Get()
  @UseGuards(TokenGuard)
  async findAll(
    @Query('resources') resources: number[],
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return await this.timeslotsService.findAll(resources, startDate, endDate);
  }

  @Get('find/:id')
  @UseGuards(TokenGuard)
  async findById(@Param('id') id: number) {
    return await this.timeslotsService.find(id);
  }

  @Post()
  @UseGuards(TokenGuard)
  async create(@Body() payload: CreateTimeslotPayloadDto) {
    return this.timeslotsService.create(payload);
  }

  @Delete('delete')
  @UseGuards(TokenGuard)
  async delete(@Query('id') id: number, @Query('scope') scope: string) {
    return this.timeslotsService.delete(id, scope);
  }
}
