import { SettingsController } from './settings.controller';
import { TariffTypeEntity } from './../entities/tariff-type.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { TariffTypesService } from './services/tariff-types.service';
import { AccountService } from './services/account.service';
import { UserEntity } from 'src/entities/user.entity';
import { SyncWzagendaUserEntity } from 'src/entities/sync-wzagenda-user.entity';
import { NotificationService } from './services/notification.service';
import { AccountSecurityService } from './services/account-security.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TariffTypeEntity,
      UserEntity,
      SyncWzagendaUserEntity,
    ]),
  ],
  controllers: [SettingsController],
  providers: [
    TariffTypesService,
    AccountService,
    NotificationService,
    AccountSecurityService,
  ],
})
export class SettingsModule {}
