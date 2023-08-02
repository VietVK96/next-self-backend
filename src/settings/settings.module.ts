import { SettingsController } from './settings.controller';
import { TariffTypeEntity } from './../entities/tariff-type.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { TariffTypesService } from './services/tariff-types.service';
import { AccountSecurityService } from './services/account-security.service';
import { UserEntity } from 'src/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TariffTypeEntity, UserEntity])],
  controllers: [SettingsController],
  providers: [TariffTypesService, AccountSecurityService],
})
export class SettingsModule {}
