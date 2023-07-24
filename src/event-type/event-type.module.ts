import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventTypeService } from './services/event-type.service';
import { EventTypeEntity } from 'src/entities/event-type.entity';
import { EventTypeController } from './event-type.controller';
import { UserEntity } from 'src/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EventTypeEntity, UserEntity])],
  controllers: [EventTypeController],
  providers: [EventTypeService],
})
export class EventTypeModule {}
