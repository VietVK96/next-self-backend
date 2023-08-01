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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { PeriodontalChartsService } from './services/periodontal-charts.service';
import {
  CreateChartsDto,
  IndexDto,
  ShowDto,
} from './dto/periodontal-charts.dto';

@ApiBearerAuth()
@Controller('periodontal-charts')
@ApiTags('Periodontal-charts')
export class PeriodontalChartsController {
  constructor(private periodontalChartsService: PeriodontalChartsService) {}

  // File php/periodontal-charts/index.php
  @Get('/index')
  @UseGuards(TokenGuard)
  async findAll(@Query() payload: IndexDto) {
    return this.periodontalChartsService.index(payload?.patient_id);
  }

  @Get('/show')
  @UseGuards(TokenGuard)
  async show(@Query() payload: ShowDto) {
    return this.periodontalChartsService.show(payload?.id);
  }

  @Delete('/delete/:id')
  @UseGuards(TokenGuard)
  async delete(@Param('id') id: number) {
    return this.periodontalChartsService.delete(id);
  }

  @Post('/update')
  @UseGuards(TokenGuard)
  async update(
    @Body() payload: CreateChartsDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.periodontalChartsService.update(payload, identity);
  }
}
