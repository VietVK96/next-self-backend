import { SettingsController } from './settings.controller';
import { TariffTypeEntity } from './../entities/tariff-type.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { TariffTypesService } from './services/tariff-types.service';
import { AccountService } from './services/account.service';
import { UserEntity } from 'src/entities/user.entity';
import { SyncWzagendaUserEntity } from 'src/entities/sync-wzagenda-user.entity';
import { UserService } from 'src/user/services/user.service';
import { AddressService } from 'src/address/service/address.service';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TariffTypeEntity,
      UserEntity,
      SyncWzagendaUserEntity,
      UserMedicalEntity,
    ]),
  ],
  controllers: [SettingsController],
  providers: [TariffTypesService, AccountService, UserService, AddressService],
})
export class SettingsModule {}
