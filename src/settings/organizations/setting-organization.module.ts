import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingOrganizationController } from './setting-organization.controller';
import { SettingOrganizationService } from './services/setting-organization.service';
import { UploadEntity } from 'src/entities/upload.entity';
import { UserEntity } from 'src/entities/user.entity';
import { TagEntity } from 'src/entities/tag.entity';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';
import { ConfigService } from '@nestjs/config';
import { PermissionService } from 'src/user/services/permission.service';
import { UploadService } from 'src/upload/services/upload.service';
import { OrganizationService } from 'src/organization/service/organization.service';
import { UploadModule } from 'src/upload/upload.module';
import { UserService } from 'src/user/services/user.service';
import { AddressService } from 'src/address/service/address.service';
import { OrganizationEntity } from 'src/entities/organization.entity';

@Module({
  controllers: [SettingOrganizationController],
  providers: [
    SettingOrganizationService,
    UploadService,
    ConfigService,
    OrganizationService,
    PermissionService,
    UserService,
    AddressService
  ],
  imports: [
    TypeOrmModule.forFeature([
      UploadEntity,
      UserEntity,
      TagEntity,
      UserMedicalEntity,
      OrganizationEntity
    ]),
    UploadModule,
  ],
  exports: [SettingOrganizationService],
})
export class SettingOrganizationModule {}
