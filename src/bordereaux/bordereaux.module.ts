import { Module } from '@nestjs/common';
import { BordereauxService } from './bordereaux.service';
import { BordereauxController } from './bordereaux.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlipCheckEntity } from 'src/entities/slip-check.entity';
import { UserEntity } from 'src/entities/user.entity';
import { LibraryBankEntity } from 'src/entities/library-bank.entity';
import { PermissionService } from 'src/user/services/permission.service';
import { CashingEntity } from 'src/entities/cashing.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SlipCheckEntity,
      UserEntity,
      LibraryBankEntity,
      CashingEntity,
    ]),
  ],
  controllers: [BordereauxController],
  providers: [BordereauxService, PermissionService],
})
export class BordereauxModule {}
