import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TagService } from './services/tag.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';

import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { CreateUpdateTagDto, TagDto } from './dto/index.dto';

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
  async getTags(
    @CurrentUser() identity: UserIdentity,
    @Query() payload: TagDto,
  ) {
    try {
      return await this.tagService.getTags(identity, payload);
    } catch (error) {
      throw new CBadRequestException('tags not found', error);
    }
  }

  @Post()
  @UseGuards(TokenGuard)
  async store(
    @CurrentUser() identity: UserIdentity,
    @Body() payload: { title: string },
  ) {
    return this.tagService.store(identity.org, payload.title);
  }

  @Get('/all')
  @UseGuards(TokenGuard)
  async getAllTagsByOrganization(@CurrentUser() identity: UserIdentity) {
    return await this.tagService.getAllTagsByOrganization(identity.org);
  }

  @Put('/create')
  @UseGuards(TokenGuard)
  async createUpdateTag(
    @CurrentUser() identity: UserIdentity,
    @Body() payload: CreateUpdateTagDto,
  ) {
    return this.tagService.createUpdateTag(identity.org, payload);
  }

  @Delete('/:id')
  @UseGuards(TokenGuard)
  async createTag(@Param('id') id: number) {
    return this.tagService.deleteTag(id);
  }
}
