import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UploadEntity } from 'src/entities/upload.entity';
import { UserEntity } from 'src/entities/user.entity';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './service/organization.service';
import { PermissionService } from 'src/user/services/permission.service';
import { TagEntity } from 'src/entities/tag.entity';
import { UserService } from 'src/user/services/user.service';
import { AddressService } from 'src/address/service/address.service';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UploadEntity,
      UserEntity,
      TagEntity,
      UserMedicalEntity,
    ]),
  ],
  controllers: [OrganizationController],
  providers: [
    OrganizationService,
    PermissionService,
    UserService,
    AddressService,
  ],
  exports: [],
})
export class OrganizationModule {}
