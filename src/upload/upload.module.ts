import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UploadEntity } from 'src/entities/upload.entity';
import { UserEntity } from 'src/entities/user.entity';
import { UploadController } from './upload.controller';
import { UploadService } from './services/upload.service';
import { OrganizationService } from 'src/organization/service/organization.service';
import { PermissionService } from 'src/users/services/permission.service';

@Module({
  imports: [TypeOrmModule.forFeature([UploadEntity, UserEntity])],
  controllers: [UploadController],
  providers: [UploadService, OrganizationService, PermissionService],
  exports: [UploadService],
})
export class UploadModule {}
