import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { UserInfoEntity } from './infomation.entity';
import { SystemPromptEntity } from './system-pormt.entity';

export const listEntities = [UserEntity, UserInfoEntity, SystemPromptEntity];
@Module({
  imports: [TypeOrmModule.forFeature(listEntities)],
  controllers: [],
  providers: [],
})
export class EntityModule {}
