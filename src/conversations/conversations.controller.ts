import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { ConversationsService } from './services/conversations.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { CreateMessageDTO } from './dto/createMessage.dto';

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

  /**
   * File php/conversations/messages/findAll.php
   * Line 10 -> 26
   */
  @Get('get-message-from-conversation')
  @UseGuards(TokenGuard)
  async getMessageFromConversation(
    @Query('conversation_id') conversationId?: number,
    @Query('page') page?: number,
    @Query('page_size') size?: number,
  ) {
    return await this.conversationsService.getMessageFromConversation(
      conversationId,
      page,
      size,
    );
  }

  /**
   * File php/conversations/messages/store.php
   * Line 23 -> 70
   */
  @Post('message')
  @UseGuards(TokenGuard)
  async createMessage(
    @Body() data: CreateMessageDTO,
    @CurrentUser() userIdentity: UserIdentity,
  ) {
    const { conversationId, body } = data;
    return await this.conversationsService.createMessage(
      userIdentity.id,
      userIdentity.org,
      conversationId,
      body,
    );
  }
}
