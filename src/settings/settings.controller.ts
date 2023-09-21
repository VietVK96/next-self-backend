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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { TokenGuard, UserIdentity } from 'src/common/decorator/auth.decorator';
import { AccountSecurityService } from './services/account-security.service';
import { UpdatePassWordDto } from './dtos/user-setting.dto';
import { AccountService } from './services/account.service';
import { UpdateGoogleCalendarDto } from './dtos/google-calendar.dto';
import { NotificationService } from './services/notification.service';
import { MedicamentDatabaseService } from './services/medicament-database.service';
import {
  FindDetailMedicamentDatabaseDto,
  FindMedicamentDatabaseDto,
} from './dtos/medicament-database.dto';
import { AccountWzAgendaSubmitDto } from './dtos/wzagenda.dto';

@ApiBearerAuth()
@ApiTags('Settings')
@Controller('/settings')
export class SettingsController {
  constructor(
    private tariffTypesSerivce: TariffTypesService,
    private accountSecurityService: AccountSecurityService,
    private accountService: AccountService,
    private notificationService: NotificationService,
    private medicamentDatabaseService: MedicamentDatabaseService,
  ) {}

  // settings/tariff-types/index.php
  @Get('/tariff-types')
  @UseGuards(TokenGuard)
  async getAllTariffTypes(@CurrentUser() identity: UserIdentity) {
    return await this.tariffTypesSerivce.getAllTariffTypes(identity);
  }

  // settings/tariff-types/create.php
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

  // settings/tariff-types/edit.php?id=:id
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

  // settings/tariff-types/delete.php?id=:id
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

  //  https://ecoo.ltsgroup.tech/settings/account/security
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
  // settings/account/wzagenda.php
  @Get('/account/wzagenda')
  @UseGuards(TokenGuard)
  async fetchAccountWzagenda(@CurrentUser() identity: UserIdentity) {
    return await this.accountService.fetchAccountWzagenda(identity);
  }

  @Get('/account/interfaceage')
  @UseGuards(TokenGuard)
  async fetchAccountPractitioners(@CurrentUser() identity: UserIdentity) {
    return await this.accountService.fetchAccountPractitioners(identity.org);
  }
  //settings/account/google.php
  @Get('/account/google-calendar')
  @UseGuards(TokenGuard)
  async getGoogleCalendar(@CurrentUser() identity: UserIdentity) {
    return await this.accountService.getGoogleCalendar(identity.id);
  }

  //settings/account/google.php
  @Post('/account/google-calendar')
  @UseGuards(TokenGuard)
  async updateGoogleCalendar(
    @CurrentUser() identity: UserIdentity,
    @Body() body: UpdateGoogleCalendarDto,
  ) {
    return await this.accountService.updateGoogleCalendar(identity, body);
  }

  @Get('/notification/historical')
  @UseGuards(TokenGuard)
  async getNotificationHistorical(@CurrentUser() identity: UserIdentity) {
    return await this.notificationService.getNotificationHistorical(
      identity.id,
    );
  }

  //settings/medicament-databases/index.php
  //all lines
  @Get('/medicament-database')
  @UseGuards(TokenGuard)
  async connnectMedicamentDatabase(@CurrentUser() identity: UserIdentity) {
    return await this.medicamentDatabaseService.connnectMedicamentDatabase(
      identity.id,
    );
  }

  //php/bcb/findAll.php
  //all lines
  @Get('/medicament-database/find')
  @UseGuards(TokenGuard)
  async findMedicamentDatabase(
    @CurrentUser() identity: UserIdentity,
    @Query() query: FindMedicamentDatabaseDto,
  ) {
    return await this.medicamentDatabaseService.findMedicamentDatabase(
      identity.id,
      query,
    );
  }

  //php/bcb/prescription/find.php
  //all lines
  @Get('/medicament-database/find/detail')
  @UseGuards(TokenGuard)
  async findDetailMedicamentDatabase(
    @CurrentUser() identity: UserIdentity,
    @Query() query: FindDetailMedicamentDatabaseDto,
  ) {
    return await this.medicamentDatabaseService.findDetailMedicamentDatabase(
      identity.org,
      identity.id,
      query,
    );
  }

  //settings/account/wzagenda-submit.php
  @Post('/account/wzagenda-submit')
  @UseGuards(TokenGuard)
  async wzAgendaSubmit(
    @CurrentUser() identity: UserIdentity,
    @Body() body: AccountWzAgendaSubmitDto,
  ) {
    return await this.accountService.accountWzAgendaSubmit(identity, body);
  }
}
