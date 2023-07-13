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

@ApiBearerAuth()
@ApiTags('NgapKeys')
@Controller('/ngap-keys')
export class NgapKeysController {
  constructor(private ngapKeysService: NgapKeysService) {}

  /**
   * php/ngap-keys/index.php
   */
  @Get()
  @UseGuards(TokenGuard)
  async findAllNgapKeys(
    @CurrentUser() identity: UserIdentity,
    @Query('used') used?: string,
  ) {
    return this.ngapKeysService.findAll(used, identity);
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
    @CurrentUser() identity: UserIdentity,
    @Body() conditions: FindManyOptions<NgapKeyEntity>,
  ) {
    return await this.ngapKeysService.findByCondition(conditions, identity);
  }
}
