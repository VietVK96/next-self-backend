import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { NgapKeysService } from './services/ngap-keys.service';
import { FindManyOptions } from 'typeorm';
import { NgapKeyEntity } from 'src/entities/ngapKey.entity';
import { identity } from 'rxjs';

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

  @Post('/find')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'HN',
        },
      },
    },
  })
  @UseGuards(TokenGuard)
  async findByConditions(
    @Body() conditions: FindManyOptions<NgapKeyEntity>,
    @CurrentUser() identity: UserIdentity,
  ) {
    return await this.ngapKeysService.findByCondition(conditions, identity);
  }
}
