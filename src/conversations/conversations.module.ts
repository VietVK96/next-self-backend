import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationEntity } from 'src/entities/conversation.entity';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './services/conversations.service';
import { ConversationMessageEntity } from 'src/entities/conversation-message.entity';
import { UserEntity } from 'src/entities/user.entity';
import { ConversationMemberEntity } from 'src/entities/conversation-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConversationEntity,
      ConversationMessageEntity,
      UserEntity,
      ConversationMemberEntity,
    ]),
  ],
  providers: [ConversationsService],
  controllers: [ConversationsController],
})
export class ConversationsModule {}
