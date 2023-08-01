import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationEntity } from 'src/entities/conversation.entity';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './services/conversations.service';

@Module({
  imports: [TypeOrmModule.forFeature([ConversationEntity])],
  controllers: [ConversationsController],
  providers: [ConversationsService],
})
export class ConversationsModule {}
