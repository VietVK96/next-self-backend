import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UserEntity } from 'src/entities/user.entity';
import { TestController } from './test.controller';
import { TestService } from './service/test.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [TestController],
  providers: [TestService],
  exports: [],
})
export class TestModule {}
