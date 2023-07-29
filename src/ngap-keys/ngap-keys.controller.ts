import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { NgapKeysService } from './services/ngap-keys.service';
import { FindManyOptions } from 'typeorm';
import { NgapKeyEntity } from 'src/entities/ngapKey.entity';
import { UpdateNgapKeyDto } from './dto/ngap-keys.dto';

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

  //settings/ngap-keys/edit.php
  //all line
  @Put('/:id')
  @UseGuards(TokenGuard)
  async update(
    @CurrentUser() identity: UserIdentity,
    @Body() body: UpdateNgapKeyDto,
    @Param('id') id: number,
  ) {
    return await this.ngapKeysService.update(id, body, identity.id);
  }
}
