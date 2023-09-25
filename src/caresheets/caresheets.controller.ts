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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { CaresheetsDto } from './dto/index.dto';
import { ActsService } from './service/caresheets.service';
import { CaresheetStatusRes } from './reponse/index.res';
import { TokenDownloadGuard } from 'src/common/decorator/token-download.decorator';
import type { Response } from 'express';

@ApiBearerAuth()
@ApiTags('Caresheets')
@Controller('caresheets')
export class CaresheetsController {
  constructor(private service: ActsService) {}

  /**
   * file: php/service/caresheet/store.php
   */
  @Post('store')
  @UseGuards(TokenGuard)
  async store(@Body() request: CaresheetsDto) {
    return await this.service.store(request);
  }

  /**
   * file: php/caresheets/show.php
   */
  @Get('show')
  @UseGuards(TokenGuard)
  async show(@Query('id') id: number) {
    return await this.service.show(id);
  }

  /* php/user/caresheets/index.php
   * 16-121
   */
  @Get('/user')
  @UseGuards(TokenGuard)
  async getUserCaresheet(
    @Query('id') id: number,
    @Query('page') page?: number,
    @Query('page_size') size?: number,
    @Query('filterParam') filterParam?: string[],
    @Query('filterValue') filterValue?: string[],
  ) {
    return await this.service.getUserCaresheet(
      id,
      page,
      size,
      filterParam,
      filterValue,
    );
  }

  /**
   * php/caresheets/statuses/index.php
   * 13-24
   */
  @Get('/status')
  @UseGuards(TokenGuard)
  async getAllCaresheetStatus(): Promise<CaresheetStatusRes[]> {
    return await this.service.getAllCaresheetStatus();
  }

  /**
   * sesam-vitale/caresheets/update.php
   * 16-61
   */
  @Post('/update')
  @UseGuards(TokenGuard)
  async update(@Query('id') id?: number) {
    return await this.service.update(id);
  }

  /**
   * php/caresheets/print.php
   * 12-80
   */

  @Get('/print')
  @UseGuards(TokenDownloadGuard)
  async print(
    @Res() res: Response,
    @CurrentUser() identity: UserIdentity,
    @Query('id') ids?: Array<number>,
    @Query('duplicata') duplicata?: boolean,
  ) {
    const buffer = await this.service.print(identity.id, ids, duplicata);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=print.pdf`,
      'Content-Length': buffer?.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: 0,
    });
    res.end(buffer);
  }

  /**
   * php/caresheets/duplicata.php
   * 12-80
   */

  @Get('/duplicata')
  @UseGuards(TokenDownloadGuard)
  async duplicata(
    @Res() res: Response,
    @Query('id') id?: number,
    @Query('duplicata') duplicata?: boolean,
  ) {
    const buffer = await this.service.duplicata(id, duplicata);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=print.pdf`,
      'Content-Length': buffer?.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: 0,
    });
    res.end(buffer);
  }

  //ecoophp/php/caresheets/quittance.php
  @Get('/quittance')
  @UseGuards(TokenDownloadGuard)
  async quittance(
    @Res() res: Response,
    @CurrentUser() identity: UserIdentity,
    @Query('id') ids?: Array<number>,
    @Query('duplicata') duplicata?: boolean,
  ) {
    // TODO Create service quittance
    const buffer = await this.service.print(identity.id, ids, duplicata);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=print.pdf`,
      'Content-Length': buffer?.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: 0,
    });
    res.end(buffer);
  }

  /**
   * php/caresheets/download.php
   * 15-84
   */

  @Get('/download')
  @UseGuards(TokenGuard)
  async download(
    @Res() res: Response,
    @CurrentUser() identity: UserIdentity,
    @Query('id') ids?: Array<number>,
    @Query('duplicata') duplicata?: boolean,
  ) {
    const buffer = await this.service.download(identity.id, ids, duplicata);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename=factures.zip`,
      'Content-Length': buffer?.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: 0,
    });
    res.end(buffer);
  }

  /**
   * php/lots/bordereau-teletransmission.php -> full
   */
  @Get('lots/bordereau-teletransmission')
  @UseGuards(TokenGuard)
  async printBordereau(
    @Res() res: Response,
    @Query('id') id?: number,
    @Query('user_id') user_id?: number,
  ) {
    const buffer = await this.service.printLotBordereau(id, user_id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=print.pdf`,
      'Content-Length': buffer?.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: 0,
    });
    res.end(buffer);
  }

  // File php/caresheets/delete.php
  @Delete('/delete/:id')
  @UseGuards(TokenGuard)
  async delete(@Param('id') id: number) {
    return this.service.deleteCaresheet(id);
  }

  // File php/caresheets/update.php
  @Post('/save/:id')
  @UseGuards(TokenGuard)
  async updateCaresheet(@Param('id') id: number) {
    return this.service.updateCaresheet(id);
  }

  @Get('/printQuittance')
  @UseGuards(TokenGuard)
  async printQuittance(@Res() res: Response, @Query('id') ids?: number) {
    const buffer = await this.service.printQuittance(ids);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=print.pdf`,
      'Content-Length': buffer?.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: 0,
    });
    res.end(buffer);
  }
}
