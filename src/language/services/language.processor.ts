import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { LanguageService } from './language.service';

@Processor('language')
export class LanguageProcessor {
  private readonly logger = new Logger(LanguageProcessor.name);
  constructor(private service: LanguageService) {}

  @Process('update')
  handleUpdate(job: Job) {
    this.logger.debug('Start transcoding...');
    this.logger.debug(job.data);
    this.service.updateLang();
    this.logger.debug('Transcoding completed');
  }
}
