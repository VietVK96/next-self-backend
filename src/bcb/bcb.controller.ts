import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { BcbServices } from './services/bcb.services';
import { BcbDto } from './dto/bcb.dto';

@Controller('bcb')
@ApiTags('Bcb')
@ApiBearerAuth()
export class BcbController {
  constructor(private readonly bcbServices: BcbServices) {}

  // php/bcb/findAll.php full file
  //same as file in src/settings/settings.controller.ts -> @Get('/medicament-database/find')
  @Post()
  @UseGuards(TokenGuard)
  async findAll(@Body() payload: BcbDto) {
    return await this.bcbServices.findAll(payload);
  }
}
