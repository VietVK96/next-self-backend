import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { UserInfoEntity } from './infomation.entity';

export const listEntities = [UserEntity, UserInfoEntity];
@Module({
  imports: [TypeOrmModule.forFeature(listEntities)],
  controllers: [],
  providers: [],
})
export class EntityModule {}
