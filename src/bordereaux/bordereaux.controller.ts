import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { BordereauxService } from './bordereaux.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';

@Controller('bordereaux')
@ApiTags('Bordereaux')
@ApiBearerAuth()
export class BordereauxController {
  constructor(private readonly bordereauxService: BordereauxService) {}

  /**
   * File php/bordereaux/show.php 100%
   *
   * @param id
   * @returns
   */
  @Get('show/:id')
  @UseGuards(TokenGuard)
  async findOne(@Param('id') id: string) {
    return await this.bordereauxService.findOne(+id);
  }

  /**
   * File php/bordereaux/show.php 100%
   *
   * @param id
   * @returns
   */
  @Get('print/:id')
  @UseGuards(TokenGuard)
  async printPdf(@Res() res, @Param('id') id: number) {
    const buffer = await this.bordereauxService.printPdf(id);
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
}
