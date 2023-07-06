import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { NgapKeysService } from './services/ngap-keys.service';

@ApiBearerAuth()
@ApiTags('NgapKeys')
@Controller('/ngap-keys')
export class NgapKeysController {
  constructor(private ngapKeysService: NgapKeysService) {}

  /**
   * php\ngap-keys\index.php
   */
  @Get()
  @UseGuards(TokenGuard)
  async findAllNgapKeys(@Query('used') used?: string) {
    return this.ngapKeysService.findAll(used);
  }
}
