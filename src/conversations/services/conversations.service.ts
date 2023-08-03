import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { ConversationMemberEntity } from 'src/entities/conversation-member.entity';
import { ConversationMessageEntity } from 'src/entities/conversation-message.entity';
import { ConversationEntity } from 'src/entities/conversation.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';

@Injectable()
export class ConversationsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(ConversationMessageEntity)
    private readonly conversationMessageRepository: Repository<ConversationMessageEntity>,
    @InjectRepository(ConversationMemberEntity)
    private readonly conversationMemberRepository: Repository<ConversationMemberEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
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
    const query = await this.conversationMessageRepository
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

  /**
   * File php/conversations/messages/store.php
   * Line 20 -> 75
   */
  async createMessage(
    userId: number,
    groupId: number,
    conversationId: number,
    body: string,
  ) {
    const conversationMessageEntity = new ConversationMessageEntity();
    conversationMessageEntity.conversation =
      await this.conversationRepository.findOne({
        where: { id: conversationId },
      });
    conversationMessageEntity.user = await this.userRepository.findOne({
      where: { id: userId },
    });
    conversationMessageEntity.body = body;

    const notificationQuery = `
      INSERT INTO notification (user_id, notification_operation_id, item_id, title, body)
      SELECT conversation_member.user_id, 1, conversation_member.conversation_id, conversation.title, ?
      FROM conversation_member
      JOIN conversation
      WHERE conversation_member.conversation_id = ?
        AND conversation_member.conversation_id = conversation.id
        AND conversation_member.user_id != ?
    `;
    await this.entityManager.query(notificationQuery, [
      body,
      conversationId,
      userId,
    ]);

    const pushNotificationQuery = `
      INSERT INTO push_notification (group_id, item_id, title, body)
      SELECT ?, conversation.id, conversation.title, ?
      FROM conversation
      WHERE conversation.id = ?
    `;
    await this.entityManager.query(pushNotificationQuery, [
      groupId,
      body,
      conversationId,
    ]);

    let conversationMessage: ConversationMessageEntity;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(conversationMessageEntity);
      await queryRunner.commitTransaction();
      conversationMessage = await this.conversationMessageRepository.findOne({
        where: { id: conversationMessageEntity.id },
        select: {
          user: {
            id: true,
            lastname: true,
            firstname: true,
            color: true,
          },
        },
        relations: { user: true },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return conversationMessage;
  }

  async getConversationById(id: number) {
    const conversation = await this.conversationRepository.findOneBy({ id });
    return conversation;
  }

  async deleteConversation(id: number) {
    if (id) {
      return await this.conversationRepository.delete(id);
    }
  }

  async getUserById(id: number) {
    return await this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        lastname: true,
        firstname: true,
        color: true,
      },
    });
  }

  async createConversation(conversation: ConversationEntity) {
    return await this.conversationRepository.save(conversation);
  }
}
