import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UserEntity } from 'src/entities/user.entity';
import { BankController } from './bank.controller';
import { BankService } from './service/bank.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [BankController],
  providers: [BankService],
  exports: [],
})
export class BankModule {}
