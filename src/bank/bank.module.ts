import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UserEntity } from 'src/entities/user.entity';
import { BankController } from './bank.controller';
import { BankService } from './service/bank.service';
import { PermissionService } from 'src/user/services/permission.service';
import { OrganizationEntity } from 'src/entities/organization.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, OrganizationEntity])],
  controllers: [BankController],
  providers: [BankService, PermissionService],
  exports: [],
})
export class BankModule {}
