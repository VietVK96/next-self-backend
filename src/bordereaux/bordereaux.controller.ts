import { Controller, Get, Param, UseGuards } from '@nestjs/common';
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
  findOne(@Param('id') id: string) {
    return this.bordereauxService.findOne(+id);
  }
}
