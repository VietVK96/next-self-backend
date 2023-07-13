import { Controller, Post, Query } from '@nestjs/common';
import { CaresheetsDto } from './dto/index.dto';
import { ApiTags } from '@nestjs/swagger';
import { CaresheetsService } from './service/caresheets.service';

@ApiTags('Caresheets')
@Controller('caresheets')
export class CaresheetsController {
  constructor(private service: CaresheetsService) {}

  /**
   * File: auth\validation.php
   */
  @Post('store')
  async store(@Query() request: CaresheetsDto) {
    return await this.service.store(request);
  }
}
