import { MailService } from './services/mail.service';
import { Controller, Get, Headers } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('/mails')
@ApiTags('Mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get('/')
  async findAll() {
    return await this.mailService.findAll(null);
  }
}
