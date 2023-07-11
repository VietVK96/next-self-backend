import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UserEntity } from 'src/entities/user.entity';
import { TagController } from './tag.controller';
import { TagService } from './services/tag.service';
import { OrganizationService } from 'src/organization/service/organization.service';
import { PermissionService } from 'src/user/services/permission.service';
import { TagEntity } from 'src/entities/tag.entity';
import { UserService } from 'src/user/services/user.service';
import { AddressService } from 'src/address/service/address.service';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TagEntity, UserEntity, UserMedicalEntity]),
  ],
  controllers: [TagController],
  providers: [
    TagService,
    OrganizationService,
    PermissionService,
    UserService,
    AddressService,
  ],
  exports: [TagService],
})
export class TagModule {}
