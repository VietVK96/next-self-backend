import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { ContactEntity } from '../entities/contact.entity';
import { ContactModule } from 'src/contact/contact.module';
import { CaresheetsController } from './caresheets.controller';
import { FseEntity } from 'src/entities/fse.entity';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { PatientAmoEntity } from 'src/entities/patient-amo.entity';
import { DentalEventTaskEntity } from 'src/entities/dental-event-task.entity';
import { CcamEntity } from 'src/entities/ccam.entity';
import { CaresheetStatusEntity } from 'src/entities/caresheet-status.entity';
import { InterfacageService } from 'src/interfacage/services/interfacage.service';
import { PermissionService } from 'src/user/services/permission.service';
import { HttpModule } from '@nestjs/axios';
import { ActsService } from './service/caresheets.service';
import { ThirdPartyAmcEntity } from 'src/entities/third-party-amc.entity';
import { ThirdPartyAmoEntity } from 'src/entities/third-party-amo.entity';
import { SesamvitaleTeletranmistionService } from './service/sesamvitale-teletranmistion.service';
import { LotEntity } from 'src/entities/lot.entity';
import { StoreCaresheetsService } from './service/store.caresheets.service';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { PatientService } from 'src/patient/service/patient.service';
import { AddressModule } from 'src/address/address.module';
import { AmoEntity } from 'src/entities/amo.entity';
import { AmcEntity } from 'src/entities/amc.entity';
import { LibraryActEntity } from 'src/entities/library-act.entity';
import { LettersEntity } from 'src/entities/letters.entity';
import { DocumentMailService } from 'src/mail/services/document.mail.service';
import { MailModule } from 'src/mail/mail.module';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContactEntity,
      UserEntity,
      DentalEventTaskEntity,
      FseEntity,
      EventTaskEntity,
      PatientAmoEntity,
      CcamEntity,
      CaresheetStatusEntity,
      ThirdPartyAmcEntity,
      ThirdPartyAmoEntity,
      LotEntity,
      ContactUserEntity,
      AmoEntity,
      AmcEntity,
      LibraryActEntity,
      LettersEntity,
      ContactNoteEntity,
    ]),
    forwardRef(() => ContactModule),
    HttpModule,
    AddressModule,
    MailModule,
  ],
  controllers: [CaresheetsController],
  providers: [
    PermissionService,
    ActsService,
    InterfacageService,
    SesamvitaleTeletranmistionService,
    StoreCaresheetsService,
    PatientService,
    DocumentMailService,
  ],
  exports: [ActsService],
})
export class CaresheetsModule {}
