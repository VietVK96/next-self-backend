import { Module } from '@nestjs/common';
import { EmailSettingController } from './email/email.setting.controller';
import { EmailSettingService } from './email/email.setting.service';
import { AccounSettingController } from './account/account.controller';
import { AccountSettingService } from './account/account.service';
import { NotificationSettingController } from './notification/notification.setting.controller';
import { NotificationSettingService } from './notification/notification.setting.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailAccountEntity } from 'src/entities/email-account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmailAccountEntity])],
  controllers: [
    EmailSettingController,
    AccounSettingController,
    NotificationSettingController,
  ],
  providers: [
    EmailSettingService,
    AccountSettingService,
    NotificationSettingService,
  ],
})
export class SettingModule {}
