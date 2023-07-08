import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UserEntity } from 'src/entities/user.entity';
import { TagController } from './tag.controller';
import { TagService } from './services/tag.service';
import { OrganizationService } from 'src/organization/service/organization.service';
import { PermissionService } from 'src/user/services/permission.service';
import { TagEntity } from 'src/entities/tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TagEntity, UserEntity])],
  controllers: [TagController],
  providers: [TagService, OrganizationService, PermissionService],
  exports: [TagService],
})
export class TagModule {}
