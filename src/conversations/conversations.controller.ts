import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { ConversationsService } from './services/conversations.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { CreateMessageDTO } from './dto/createMessage.dto';
import { ConversationEntity } from 'src/entities/conversation.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { ErrorCode } from 'src/constants/error';
import { CreateConversationDTO } from './dto/createConversation.dto';
import { ConversationMemberEntity } from 'src/entities/conversation-member.entity';

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

  /**
   * File php/conversations/delete.php
   * Line 20 -> 39
   */
  @Delete('/:id')
  @UseGuards(TokenGuard)
  async deleteConversation(
    @CurrentUser() user: UserIdentity,
    @Param('id') id: number,
  ) {
    const conversation: ConversationEntity =
      await this.conversationsService.getConversationById(id);
    if (!conversation) {
      throw new CNotFoundRequestException(ErrorCode.NOT_FOUND_CONVERSATION);
    }
    if (conversation.userId !== user.id) {
      throw new CBadRequestException(ErrorCode.CAN_NOT_DELETE_CONVERSATION);
    }
    return await this.conversationsService.deleteConversation(conversation?.id);
  }

  /**
   * File php/conversations/store.php
   * Line 19 -> 56
   */
  @Post('/create')
  @UseGuards(TokenGuard)
  async createConversation(
    @CurrentUser() user: UserIdentity,
    @Body() data: CreateConversationDTO,
  ) {
    const { title, users } = data;
    if (!title) {
      throw new CBadRequestException(ErrorCode.INVALID_PARAMETER);
    }

    const members: number[] = Array.from(new Set([...users, user.id]));
    if (!members.length) {
      throw new CBadRequestException(ErrorCode.INVALID_PARAMETER);
    }
    const conversation = new ConversationEntity();
    conversation.user = await this.conversationsService.getUserById(user.id);
    conversation.title = title;
    conversation.members = [];
    conversation.userId = user.id;

    for (const memberId of members) {
      const member = new ConversationMemberEntity();
      member.user = await this.conversationsService.getUserById(memberId);
      conversation.members.push(member);
    }
    return await this.conversationsService.createConversation(conversation);
  }
}