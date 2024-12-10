import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/user.entity';

export const listEntities = [UserEntity];
@Module({
  imports: [TypeOrmModule.forFeature(listEntities)],
  controllers: [],
  providers: [],
})
export class EntityModule {}
