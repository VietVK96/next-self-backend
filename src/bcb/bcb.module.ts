import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BcbServices } from './services/bcb.services';
import { BcbController } from './bcb.controller';
import { UserEntity } from 'src/entities/user.entity';
import { ClaudeBernardService } from './services/claudeBernard.Service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ContraindicationEntity } from 'src/entities/contraindication.entity';
import { ContactEntity } from 'src/entities/contact.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      ContraindicationEntity,
      ContactEntity,
    ]),
    ConfigModule,
    HttpModule,
  ],
  controllers: [BcbController],
  exports: [BcbServices],
  providers: [BcbServices, ClaudeBernardService],
})
export class BcbModule {}
