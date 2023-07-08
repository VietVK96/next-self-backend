import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UploadEntity } from 'src/entities/upload.entity';
import { UserEntity } from 'src/entities/user.entity';
import { FileController } from './file.controller';
import { FileService } from './services/file.service';
import { OrganizationService } from 'src/organization/service/organization.service';
import { PermissionService } from 'src/user/services/permission.service';
import { TagEntity } from 'src/entities/tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UploadEntity, UserEntity, TagEntity])],
  controllers: [FileController],
  providers: [FileService, OrganizationService, PermissionService],
  exports: [FileService],
})
export class FileModule {}
