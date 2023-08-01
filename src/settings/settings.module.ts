import { SettingsController } from './settings.controller';
import { TariffTypeEntity } from './../entities/tariff-type.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { TariffTypesService } from './services/tariff-types.service';
import { ConfigService } from '@nestjs/config';
import { AddressService } from 'src/address/service/address.service';
import { OrganizationService } from 'src/organization/service/organization.service';
import { UploadService } from 'src/upload/services/upload.service';
import { PermissionService } from 'src/user/services/permission.service';
import { UserService } from 'src/user/services/user.service';
import { SettingOrganizationService } from './services/setting-organization.service';
import { SettingOrganizationController } from './setting-organization.controller';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { TagEntity } from 'src/entities/tag.entity';
import { UploadEntity } from 'src/entities/upload.entity';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';
import { UserEntity } from 'src/entities/user.entity';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TariffTypeEntity,
      UploadEntity,
      UserEntity,
      TagEntity,
      UserMedicalEntity,
      OrganizationEntity,
    ]),
    UploadModule,
  ],
  controllers: [SettingsController, SettingOrganizationController],
  providers: [
    TariffTypesService,
    SettingOrganizationService,
    UploadService,
    ConfigService,
    OrganizationService,
    PermissionService,
    UserService,
    AddressService,
  ],
  exports: [SettingOrganizationService],
})
export class SettingsModule {}
