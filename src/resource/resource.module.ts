import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { ResourceEntity } from 'src/entities/resource.entity';
import { ResourceService } from './services/resource.service';
import { ResourceController } from './resource.controller';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { UserResourceEntity } from 'src/entities/user-resource.entity';
import { UserEntity } from 'src/entities/user.entity';
import { MailTransportService } from 'src/mail/services/mailTransport.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      ResourceEntity,
      UserResourceEntity,
      OrganizationEntity,
    ]),
  ],
  controllers: [ResourceController],
  providers: [ResourceService, MailTransportService],
})
export class ResourceModule {}
