import { UpdateTariffTypeDto } from './dtos/update.tariff-type.dto';
import { CreateTariffTypeDto } from './dtos/create.tariff-type.dto';
import { CurrentUser } from './../common/decorator/auth.decorator';
import { TariffTypesService } from './services/tariff-types.service';
import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Body,
  Delete,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { TokenGuard, UserIdentity } from 'src/common/decorator/auth.decorator';
import { AccountSecurityService } from './services/account-security.service';
import { UpdatePassWordDto } from './dtos/user-setting.dto';

@ApiBearerAuth()
@ApiTags('Settings')
@Controller('/settings')
export class SettingsController {
  constructor(
    private tariffTypesSerivce: TariffTypesService,
    private accountSecurityService: AccountSecurityService,
  ) {}

  // https://ecoo.ltsgroup.tech/settings/tariff-types/index.php
  @Get('/tariff-types')
  @UseGuards(TokenGuard)
  async getAllTariffTypes(@CurrentUser() identity: UserIdentity) {
    return await this.tariffTypesSerivce.getAllTariffTypes(identity);
  }

  // https://ecoo.ltsgroup.tech/settings/tariff-types/create.php
  @Post('/tariff-types')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: '',
        },
      },
    },
  })
  @UseGuards(TokenGuard)
  async createTariffType(
    @CurrentUser() identity: UserIdentity,
    @Body() body: CreateTariffTypeDto,
  ) {
    return await this.tariffTypesSerivce.createTariffType(identity, body.name);
  }

  // https://ecoo.ltsgroup.tech/settings/tariff-types/edit.php?id=:id
  @Patch('/tariff-types/:id')
  @UseGuards(TokenGuard)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: '',
        },
      },
    },
  })
  async editTariffType(
    @CurrentUser() identity: UserIdentity,
    @Param('id') id: string,
    @Body() body: UpdateTariffTypeDto,
  ) {
    return await this.tariffTypesSerivce.editTariffType(
      identity,
      parseInt(id),
      body,
    );
  }

  // https://ecoo.ltsgroup.tech/settings/tariff-types/delete.php?id=:id
  @Delete('/tariff-types/:id')
  @UseGuards(TokenGuard)
  async deleteTariffType(
    @CurrentUser() identity: UserIdentity,
    @Param('id') id: string,
  ) {
    return await this.tariffTypesSerivce.deleteTariffType(
      identity,
      parseInt(id),
    );
  }

  // File php/user/therapeutic-alternatives/index.php
  @Post('/account/security')
  @UseGuards(TokenGuard)
  async updatePasswordAccount(
    @CurrentUser() identity: UserIdentity,
    @Body() updatePassAccountDto: UpdatePassWordDto,
  ) {
    return await this.accountSecurityService.updatePasswordAccount(
      identity.id,
      updatePassAccountDto,
    );
  }
}
