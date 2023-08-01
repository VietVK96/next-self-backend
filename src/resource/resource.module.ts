import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { ResourceEntity } from 'src/entities/resource.entity';
import { ResourceService } from './services/resource.service';
import { ResourceController } from './resource.controller';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { UserResourceEntity } from 'src/entities/user-resource.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ResourceEntity,
      UserResourceEntity,
      OrganizationEntity,
    ]),
  ],
  controllers: [ResourceController],
  providers: [ResourceService],
})
export class ResourceModule {}
