import { SettingsController } from './settings.controller';
import { TariffTypeEntity } from './../entities/tariff-type.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { TariffTypesService } from './services/tariff-types.service';
import { AccountService } from './services/account.service';
import { UserEntity } from 'src/entities/user.entity';
import { SyncWzagendaUserEntity } from 'src/entities/sync-wzagenda-user.entity';
import { UserService } from 'src/user/services/user.service';
import { AddressService } from 'src/address/service/address.service';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';
import { NotificationService } from './services/notification.service';
import { AccountSecurityService } from './services/account-security.service';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { TagEntity } from 'src/entities/tag.entity';
import { UploadEntity } from 'src/entities/upload.entity';
import { UploadModule } from 'src/upload/upload.module';
import { SettingOrganizationController } from './setting-organization.controller';
import { ConfigService } from '@nestjs/config';
import { OrganizationService } from 'src/organization/service/organization.service';
import { UploadService } from 'src/upload/services/upload.service';
import { PermissionService } from 'src/user/services/permission.service';
import { SettingOrganizationService } from './services/setting-organization.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TariffTypeEntity,
      UserEntity,
      SyncWzagendaUserEntity,
      UserMedicalEntity,
      UploadEntity,
      TagEntity,
      OrganizationEntity,
    ]),
    UploadModule,
  ],
  controllers: [SettingsController, SettingOrganizationController],
  providers: [
    TariffTypesService,
    AccountService,
    NotificationService,
    AccountSecurityService,
    UserService,
    AddressService,
    SettingOrganizationService,
    UploadService,
    ConfigService,
    OrganizationService,
    PermissionService,
  ],
})
export class SettingsModule {}
