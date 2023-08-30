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
import { OrganizationEntity } from 'src/entities/organization.entity';
import { OrganizationSubscriptionEntity } from 'src/entities/organization-subcription.entity';
import { PlanEntity } from 'src/entities/plan.entity';
import { OrganizationSubscriptionService } from './service/organizationSubscription.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UploadEntity,
      UserEntity,
      TagEntity,
      UserMedicalEntity,
      OrganizationEntity,
      OrganizationSubscriptionEntity,
      PlanEntity,
    ]),
  ],
  controllers: [OrganizationController],
  providers: [
    OrganizationService,
    PermissionService,
    UserService,
    AddressService,
    OrganizationSubscriptionService,
  ],
  exports: [],
})
export class OrganizationModule {}
