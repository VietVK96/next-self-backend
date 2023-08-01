import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConversationMessageEntity } from 'src/entities/conversation-message.entity';
import { ConversationEntity } from 'src/entities/conversation.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(ConversationMessageEntity)
    private readonly conversationMessageEntity: Repository<ConversationMessageEntity>,
  ) {}

  paginate(page: number, size: number) {
    const _take = size || 50;
    const _skip = page ? (page - 1) * _take : 0;
    return {
      take: _take,
      skip: _skip,
    };
  }

  /**
   * File application/Repositories/ConversationRepository.php
   * Line 20 -> 41
   */
  async getUserConversations(userId: number, page: number, size: number) {
    const { skip, take } = this.paginate(page, size);
    const query = await this.conversationRepository
      .createQueryBuilder('conversation')
      .select([
        'conversation.id',
        'conversation.createdAt',
        'conversation.updatedAt',
        'conversation.title',
        'conversation.messageCount',
        'user.id',
        'user.lastname',
        'user.firstname',
        'user.color',
        'members2.id',
        'member_user.id',
        'member_user.lastname',
        'member_user.firstname',
        'member_user.color',
      ])
      .innerJoin('conversation.user', 'user')
      .innerJoin('conversation.members', 'members')
      .innerJoin('conversation.members', 'members2')
      .innerJoin('members2.user', 'member_user')
      .where('members.user = :id', { id: userId })
      .orderBy('conversation.updatedAt', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();
    return {
      page: page || 1,
      data: query[0],
      total: query[1],
    };
  }

  /**
   * File application/Repositories/ConversationMessageRepository.php
   * Line 20 -> 36
   */
  async getMessageFromConversation(
    conversationId: number,
    page: number,
    size: number,
  ) {
    const { skip, take } = this.paginate(page, size);
    const query = await this.conversationMessageEntity
      .createQueryBuilder('conversation_message')
      .select([
        'conversation_message',
        'user.id',
        'user.lastname',
        'user.firstname',
        'user.color',
      ])
      .innerJoin('conversation_message.user', 'user')
      .where('conversation_message.conversation = :id', { id: conversationId })
      .orderBy('conversation_message.updatedAt', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();
    return {
      page: page || 1,
      data: query[0],
      total: query[1],
    };
  }
}
