import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEntity } from 'src/entities/event.entity';
import { ContactEntity } from 'src/entities/contact.entity';
import { BcbServices } from './services/bcb.services';
import { BcbController } from './bcb.controller';
import { UserEntity } from 'src/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [BcbController],
  exports: [BcbServices],
  providers: [BcbServices],
})
export class BcbModule {}
