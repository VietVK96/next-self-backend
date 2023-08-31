import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { LanguageController } from './language.controller';
import { LanguageProcessor } from './services/language.processor';
import { LanguageService } from './services/language.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'language',
    }),
  ],
  controllers: [LanguageController],
  providers: [LanguageService, LanguageProcessor],
})
export class LanguageModule {}
