import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressModule } from 'src/address/address.module';
import { UserEntity } from 'src/entities/user.entity';
import { PermissionService } from './services/permission.service';
import { UserService } from './services/user.service';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';
import { UserController } from './user.controller';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { PreferenceService } from './services/preference.sevece';
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
import { JwtModule } from '@nestjs/jwt';
import { TokenDownloadService } from './services/token-download.service';
import { JWT_SECRET_DOWNLOAD } from 'src/constants/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserMedicalEntity,
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
    ]),
    AddressModule,
    HttpModule,
    JwtModule.register({
      secret: JWT_SECRET_DOWNLOAD,
    }),
  ],

  providers: [
    PermissionService,
    UserService,
    PreferenceService,
    TeletranmistionService,
    SesamvitaleTeletranmistionService,
    TokenDownloadService,
  ],
  exports: [PermissionService, UserService, PreferenceService],
  controllers: [UserController, UserTeletranmistionController],
})
export class UserModule {}
