import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { BullConfigService } from 'src/common/config/bull.config';
import { LanguageController } from './language.controller';
import { LanguageProcessor } from './services/language.processor';
import { LanguageService } from './services/language.service';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: 'language',
      useClass: BullConfigService,
    }),
  ],
  controllers: [LanguageController],
  providers: [LanguageService, LanguageProcessor],
})
export class LanguageModule {}
