import { Controller, Post, Query, Res } from '@nestjs/common';
import { CaresheetsDto } from './dto/index.dto';
import { Response } from 'express';
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
  async store(@Res() res: Response, @Query() request: CaresheetsDto) {
    return await this.service.store(request);
  }
}
