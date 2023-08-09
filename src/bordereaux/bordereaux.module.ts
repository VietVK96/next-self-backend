import { Module } from '@nestjs/common';
import { BordereauxService } from './bordereaux.service';
import { BordereauxController } from './bordereaux.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlipCheckEntity } from 'src/entities/slip-check.entity';
import { UserEntity } from 'src/entities/user.entity';
import { LibraryBankEntity } from 'src/entities/library-bank.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SlipCheckEntity, UserEntity, LibraryBankEntity]),
  ],
  controllers: [BordereauxController],
  providers: [BordereauxService],
})
export class BordereauxModule {}
