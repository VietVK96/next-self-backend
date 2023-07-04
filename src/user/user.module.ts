import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { UserService } from './services/user.service';
import { AddressModule } from 'src/address/address.module';
import { PermissionService } from './services/permission.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), AddressModule],
  controllers: [],
  providers: [UserService, PermissionService],
  exports: [UserService, PermissionService],
})
export class UserModule {}
