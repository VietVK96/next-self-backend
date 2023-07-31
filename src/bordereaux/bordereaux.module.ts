import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactEntity } from 'src/entities/contact.entity';
import { UserEntity } from 'src/entities/user.entity';
import { ThirdPartyAmcEntity } from 'src/entities/third-party-amc.entity';
import { ThirdPartyAmoEntity } from 'src/entities/third-party-amo.entity';
import { AmoEntity } from 'src/entities/amo.entity';
import { AmcEntity } from 'src/entities/amc.entity';
import { BordereauxService } from './service/bordereaux.service';
import { BordereauxController } from './bordereaux.controller';
import { LibraryBankEntity } from 'src/entities/library-bank.entity';
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, LibraryBankEntity])],
  controllers: [BordereauxController],
  providers: [BordereauxService],
})
export class BordereauxModule {}
