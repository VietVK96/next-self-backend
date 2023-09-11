import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AmountDueService } from './amount.due.services';

@Processor('amount-due')
export class AmountDueProcessor {
  private readonly logger = new Logger(AmountDueProcessor.name);
  constructor(private service: AmountDueService) {}

  @Process('update')
  handleUpdate(job: Job) {
    this.logger.debug('Start update amount due...');
    this.service.execute(job.data.groupId).finally(() => {
      this.logger.debug('Update amount due completed');
    });
  }
}
