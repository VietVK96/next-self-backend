import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TagService } from './services/tag.service';
import { TokenGuard } from 'src/common/decorator/auth.decorator';

import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { TagDto } from './dto/index.dto';

@ApiTags('Tags')
@Controller('tags')
@ApiBearerAuth()
export class TagController {
  constructor(private tagService: TagService) {}

  /**
   * php/tags/index.php -> full
   *
   */
  @Get('')
  @UseGuards(TokenGuard)
  async getTags(@Query() payload: TagDto) {
    try {
      return await this.tagService.getTags(payload);
    } catch (error) {
      throw new CBadRequestException('tags not found', error);
    }
  }
}
