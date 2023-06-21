import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEntity } from 'src/entities/event.entity';
import { UserModule } from 'src/users/user.module';
import { WaitingRoomController } from './waitingRoom.controller';
import { FindWaitingService } from './services/find.waiting.service';

@Module({
  imports: [TypeOrmModule.forFeature([EventEntity]), UserModule],
  controllers: [WaitingRoomController],
  providers: [FindWaitingService],
})
export class WaitingRoomModule {}
