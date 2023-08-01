import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { TeletranmistionService } from './services/teletranmistion.service';
import { TeletransmissionEntity } from 'src/entities/teletransmission.entity';
import { CaresheetStatusEntity } from 'src/entities/caresheet-status.entity';
import { UserTeletranmistionController } from './teletranmistion.controller';
import { SesamvitaleTeletranmistionService } from 'src/caresheets/service/sesamvitale-teletranmistion.service';
import { HttpModule } from '@nestjs/axios';
import { FseEntity } from 'src/entities/fse.entity';
import { LotEntity } from 'src/entities/lot.entity';
import { AmcEntity } from 'src/entities/amc.entity';
import { AmoEntity } from 'src/entities/amo.entity';
import { LotStatusEntity } from 'src/entities/lot-status.entity';
import { LotCareSheetEntity } from 'src/entities/lot-caresheet.entity';
import { NoemieEntity } from 'src/entities/noemie.entity';
import { NoemioCaresheetEntity } from 'src/entities/noemie-caresheet.entity';
import { CashingEntity } from 'src/entities/cashing.entity';
import { LibraryBankEntity } from 'src/entities/library-bank.entity';
import { CaresheetRejectionEntity } from 'src/entities/caresheet-rejection.entity';
import { ThirdPartyAmoEntity } from 'src/entities/third-party-amo.entity';
import { CashingContactEntity } from 'src/entities/cashing-contact.entity';
import { NomieService } from './services/nomie.service';
import { UserEntity } from 'src/entities/user.entity';
import { ThirdPartyAmcEntity } from 'src/entities/third-party-amc.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      ThirdPartyAmcEntity,
      UserPreferenceEntity,
      UserMedicalEntity,
      TeletransmissionEntity,
      CaresheetStatusEntity,
      FseEntity,
      LotEntity,
      AmcEntity,
      AmoEntity,
      LotStatusEntity,
      LotCareSheetEntity,
      NoemieEntity,
      NoemioCaresheetEntity,
      CashingEntity,
      LibraryBankEntity,
      CaresheetRejectionEntity,
      ThirdPartyAmoEntity,
      CashingContactEntity,
    ]),
    HttpModule,
  ],

  providers: [
    TeletranmistionService,
    SesamvitaleTeletranmistionService,
    NomieService,
  ],
  exports: [],
  controllers: [UserTeletranmistionController],
})
export class TeletranmistionModule {}
