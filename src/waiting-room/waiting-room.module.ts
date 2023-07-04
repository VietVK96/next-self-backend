import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEntity } from 'src/entities/event.entity';
import { WaitingRoomController } from './waiting-room.controller';
import { FindWaitingService } from './services/find.waiting.service';
import { UserEntity } from 'src/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EventEntity, UserEntity])],
  controllers: [WaitingRoomController],
  providers: [FindWaitingService],
})
export class WaitingRoomModule {}
