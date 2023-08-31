import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { StorageSpacePackEntity } from 'src/entities/storage-space-pack.entity';
import { StorageController } from './storage.controller';
import { StorageService } from './services/storage.service';
import { UserService } from 'src/user/services/user.service';
import { UserEntity } from 'src/entities/user.entity';
import { AddressEntity } from 'src/entities/address.entity';
import { AddressService } from 'src/address/service/address.service';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';
import { UsersStorageSpace } from './services/users-storage.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StorageSpacePackEntity,
      UserEntity,
      AddressEntity,
      UserMedicalEntity,
    ]),
  ],
  controllers: [StorageController],
  providers: [StorageService, UserService, AddressService, UsersStorageSpace],
})
export class StorageModule {}
