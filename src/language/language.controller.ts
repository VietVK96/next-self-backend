import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { Queue } from 'bull';
import { ApiTags } from '@nestjs/swagger';
import { UpdateLangDto } from './dto/update-lang.dto';

@ApiTags('Language')
@Controller('language')
export class LanguageController {
  constructor(@InjectQueue('language') private readonly languageQueue: Queue) {}

  @Post()
  async buildLang(@Body() payload: UpdateLangDto) {
    if (payload.key !== 'prv_gbfjxscrtmmbridlvubbofkfhqzltjjs') {
      throw new BadRequestException('Nokey');
    }
    // await this.service.updateLang();
    this.languageQueue.add('update');
    return {
      success: true,
    };
  }
}
