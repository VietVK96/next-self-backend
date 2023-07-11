import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UploadEntity } from 'src/entities/upload.entity';
import { UserEntity } from 'src/entities/user.entity';
import { UploadController } from './upload.controller';
import { UploadService } from './services/upload.service';
import { OrganizationService } from 'src/organization/service/organization.service';
import { PermissionService } from 'src/user/services/permission.service';
import { UserService } from 'src/user/services/user.service';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';
import { AddressService } from 'src/address/service/address.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserMedicalEntity, UploadEntity, UserEntity]),
  ],
  controllers: [UploadController],
  providers: [
    UploadService,
    UserService,
    OrganizationService,
    AddressService,
    PermissionService,
  ],
  exports: [UploadService],
})
export class UploadModule {}
