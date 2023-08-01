import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationEntity } from 'src/entities/conversation.entity';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './services/conversations.service';
import { ConversationMessageEntity } from 'src/entities/conversation-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConversationEntity, ConversationMessageEntity]),
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService],
})
export class ConversationsModule {}
