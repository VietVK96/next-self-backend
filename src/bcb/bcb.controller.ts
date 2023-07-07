import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { BcbServices } from './services/bcb.services';
import { BcbDto } from './dto/bcb.dto';

@Controller('bcb')
@ApiTags('Bcb')
@ApiBearerAuth()
export class BcbController {
  constructor(private readonly bcbServices: BcbServices) {}

  //ecoodentist-1.31.0\php\bcb\findAll.php full file
  @Post()
  @UseGuards(TokenGuard)
  async findAll(@Body() payload: BcbDto) {
    return await this.bcbServices.findAll(payload);
  }
}
