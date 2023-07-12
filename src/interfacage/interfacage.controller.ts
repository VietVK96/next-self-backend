import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { FsDto } from './dto/index.dto';
import { InterfacageService } from './services/interfacage.service';

@ApiBearerAuth()
@Controller('interfacage')
@ApiTags('Interfacage')
export class InterfacageController {
  constructor(private service: InterfacageService) {}

  @Post('/fs')
  @UseGuards(TokenGuard)
  async CheckMaximumPrice(@Body() request: FsDto) {
    return this.service.fs(request);
  }
}
