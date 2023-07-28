import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NgapKeysController } from './ngap-keys.controller';
import { NgapKeyEntity } from 'src/entities/ngapKey.entity';
import { NgapKeysService } from './services/ngap-keys.service';
import { UserEntity } from 'src/entities/user.entity';
import { PermissionService } from 'src/user/services/permission.service';

@Module({
  imports: [TypeOrmModule.forFeature([NgapKeyEntity, UserEntity])],
  controllers: [NgapKeysController],
  providers: [NgapKeysService, PermissionService],
})
export class NgapKeysModule {}
