import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { ConversationsService } from './services/conversations.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';

@Controller('conversations')
@ApiTags('Conversations')
@ApiBasicAuth()
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  /**
   * File php/conversations/findAll.php
   * Line 14 -> 30
   */
  @Get('get-conversation-by-user')
  @UseGuards(TokenGuard)
  async getUserConversations(
    @CurrentUser() userIdentity: UserIdentity,
    @Query('page') page?: number,
    @Query('page_size') size?: number,
  ) {
    return await this.conversationsService.getUserConversations(
      userIdentity.id,
      page,
      size,
    );
  }
}
