import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConversationEntity } from 'src/entities/conversation.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
  ) {}

  /**
   * File application/Repositories/ConversationRepository.php
   * Line 20 -> 41
   */
  async getUserConversations(userId: number, page: number, size: number) {
    const _size = size || 50;
    const _skip = page ? (page - 1) * _size : 0;
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
      .skip(_skip)
      .take(_size)
      .getManyAndCount();
    return {
      page: page || 1,
      data: query[0],
      total: query[1],
    };
  }
}
