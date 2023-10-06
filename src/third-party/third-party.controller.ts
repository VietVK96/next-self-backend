import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { ThirdPartyService } from './services/third-party.service';
import { ThirdPartyDto, ThirdPartyUpdateDto } from './dto/index.dto';
import { Response } from 'express';
import { CareSheetPrintService } from './services/caresheet.print.service';

@ApiBearerAuth()
@ApiTags('ThirdParty')
@Controller('/third-party')
export class ThirdPartyController {
  constructor(
    private thirdPartyService: ThirdPartyService,
    private caresheetPrintService: CareSheetPrintService,
  ) {}

  /**
   * File: php/third-party/index.php
   */
  @Get('index')
  @ApiBearerAuth()
  @UseGuards(TokenGuard)
  async getPatientThirdParty(@Query() payload: ThirdPartyDto) {
    return await this.thirdPartyService.getPatientThirdParty(payload);
  }

  /**
   * File: php/third-party/export.php
   */
  @Get('export')
  @UseGuards(TokenGuard)
  async export(@Res() res: Response, @Query() payload: ThirdPartyDto) {
    return await this.thirdPartyService.getExportQuery(res, payload);
  }

  /**
   * File: php/third-party/update.php
   */
  @Post('update')
  @UseGuards(TokenGuard)
  async update(@Query('id') id: number, @Body() payload: ThirdPartyUpdateDto) {
    return await this.thirdPartyService.updateCaresheet(id, payload);
  }

  /**
   * File: php/third-party/print.php
   */
  @Get('print')
  @UseGuards(TokenGuard)
  async print(@Query() payload: ThirdPartyDto) {
    const buffer = await this.thirdPartyService.printThirdParty(payload);
    return buffer;
  }

  /**
   * File: php/caresheet/print.php
   */
  @Get('caresheet/print')
  @UseGuards(TokenGuard)
  async careShetPrint(
    @Query('id') id: number,
    @Query('duplicata') duplicata?: boolean,
  ) {
    const buffer = await this.caresheetPrintService.print(id, duplicata);
    return buffer;
  }
}
