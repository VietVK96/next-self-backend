import { SettingsController } from './settings.controller';
import { TariffTypeEntity } from './../entities/tariff-type.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { TariffTypesService } from './services/tariff-types.service';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([TariffTypeEntity])],
  controllers: [SettingsController],
  providers: [TariffTypesService, NotificationService],
})
export class SettingsModule {}
