import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { MailService } from './services/mail.service';
import { FindAllMailDto } from './dto/findAll.mail.contact';

@ApiBearerAuth()
@Controller('/contact/mail')
@ApiTags('Contact')
export class MailController {
  constructor(private mailService: MailService) {}

  @Post('/findAll')
  @UseGuards(TokenGuard)
  async findAll(@Body() payload: FindAllMailDto) {
    return await this.mailService.findAll(payload);
  }
}
