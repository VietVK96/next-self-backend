import { Module } from '@nestjs/common';
import { EmailSettingController } from './email.setting.controller';
import { EmailSettingService } from './services/email.setting.service';

@Module({
  imports: [],
  controllers: [EmailSettingController],
  providers: [EmailSettingService],
})
export class EmailSettingModule {}
