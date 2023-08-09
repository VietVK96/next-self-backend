import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { UserPreferenceController } from './user-preference.controller';
import { UserPreferenceService } from './services/user-preference.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserPreferenceEntity])],
  controllers: [UserPreferenceController],
  providers: [UserPreferenceService],
})
export class UserPreferenceModule {}
