import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NgapKeysController } from './ngap-keys.controller';
import { NgapKeyEntity } from 'src/entities/ngapKey.entity';
import { NgapKeysService } from './services/ngap-keys.service';

@Module({
  imports: [TypeOrmModule.forFeature([NgapKeyEntity])],
  controllers: [NgapKeysController],
  providers: [NgapKeysService],
})
export class NgapKeysModule {}
