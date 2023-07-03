import { Module } from '@nestjs/common';
import { PermissionService } from './services/permission.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { AddressModule } from 'src/address/address.module';
import { UserService } from './services/user.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), AddressModule],

  providers: [PermissionService, UserService],
  exports: [PermissionService, UserService],
})
export class UserModule {}
