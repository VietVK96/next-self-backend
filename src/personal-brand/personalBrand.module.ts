import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonalBrandService } from './service/personalBrand.service';
import { PersonalBrandController } from './personalBrand.controller';
import { OpenAIService } from 'src/gpt/service/gpt.service';
import { UserEntity } from 'src/entities/user.entity';
import { UserInfoEntity } from 'src/entities/infomation.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { SystemPromptEntity } from 'src/entities/system-pormt.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, UserInfoEntity, SystemPromptEntity]),
    CacheModule.register({}),
  ],
  controllers: [PersonalBrandController],
  providers: [PersonalBrandService, OpenAIService],
  exports: [PersonalBrandService],
})
export class PersonalBrandModule {}