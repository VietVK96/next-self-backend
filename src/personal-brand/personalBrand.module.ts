import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonalBrandService } from './service/personalBrand.service';
import { PersonalBrandController } from './personalBrand.controller';
import { OpenAIService } from 'src/gpt/service/gpt.service';
import { UserEntity } from 'src/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [PersonalBrandController],
  providers: [PersonalBrandService, OpenAIService],
  exports: [PersonalBrandService],
})
export class PersonalBrandModule {}
