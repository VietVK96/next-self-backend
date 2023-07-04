import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressModule } from 'src/address/address.module';
import { UserEntity } from 'src/entities/user.entity';
import { PermissionService } from './services/permission.service';
import { UserService } from './services/user.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), AddressModule],

  providers: [PermissionService, UserService],
  exports: [PermissionService, UserService],
})
export class UserModule {}
