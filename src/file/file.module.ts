import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UploadEntity } from 'src/entities/upload.entity';
import { UserEntity } from 'src/entities/user.entity';
import { FileController } from './file.controller';
import { FileService } from './services/file.service';
import { OrganizationService } from 'src/organization/service/organization.service';
import { PermissionService } from 'src/user/services/permission.service';
import { TagEntity } from 'src/entities/tag.entity';
import { AddressService } from 'src/address/service/address.service';
import { UserService } from 'src/user/services/user.service';
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
  controllers: [FileController],
  providers: [
    FileService,
    OrganizationService,
    PermissionService,
    UserService,
    AddressService,
  ],
  exports: [FileService],
})
export class FileModule {}
