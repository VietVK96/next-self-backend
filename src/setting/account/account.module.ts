import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccounController } from './account.controller';
import { AccountService } from './services/account.service';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [AccounController],
  providers: [AccountService],
})
export class AccountModule {}
