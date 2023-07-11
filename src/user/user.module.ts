import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressModule } from 'src/address/address.module';
import { UserEntity } from 'src/entities/user.entity';
import { PermissionService } from './services/permission.service';
import { UserService } from './services/user.service';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';
import { UserController } from './user.controller';
import { AddressService } from 'src/address/service/address.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserMedicalEntity,
      UserMedicalEntity,
    ]),
    AddressModule,
  ],

  providers: [PermissionService, UserService, AddressService],
  exports: [PermissionService, UserService],
  controllers: [UserController],
})
export class UserModule {}
