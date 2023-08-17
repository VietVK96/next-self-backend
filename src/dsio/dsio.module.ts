import { Module } from '@nestjs/common';
import { DsioController } from './dsio.controller';
import { DsioImporterService } from './services/dsio-importer.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { ImporterService } from './services/importer.service';
import { ImportDsioService } from './services/import-dsio.service';
import { CommandModule } from 'src/command/command.module';
import { ContactEntity } from 'src/entities/contact.entity';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { CcamEntity } from 'src/entities/ccam.entity';
import { LibraryActQuantityEntity } from 'src/entities/library-act-quantity.entity';
import { ContactModule } from 'src/contact/contact.module';
import { LibraryBankEntity } from 'src/entities/library-bank.entity';
import { LetterImporterService } from './services/letter-importer.service';
import { UserEntity } from 'src/entities/user.entity';
import { LettersEntity } from 'src/entities/letters.entity';
import { AmountDsioService } from './services/amount-dsio.service';
import { HandleDsioService } from './services/handle-dsio.service';
import { PreDataDsioService } from './services/pre-data-dsio.service';
import { ActDsioElemService } from './services/act-dsio.elem.service';
import { InitDsioElemService } from './services/init-dsio.elem.service';
import { LibraryDsioElemService } from './services/library-dsio.elem.service';
import { PaymentDsioElemService } from './services/payment-dsio.elem.service';
import { MedicaDsioElemService } from './services/medica-dsio.elem.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserPreferenceEntity,
      ContactEntity,
      OrganizationEntity,
      CcamEntity,
      LibraryActQuantityEntity,
      LibraryBankEntity,
      UserEntity,
      LettersEntity,
    ]),
    CommandModule,
    ContactModule,
  ],
  controllers: [DsioController],
  providers: [
    ImporterService,
    DsioImporterService,
    LetterImporterService,
    InitDsioElemService,
    MedicaDsioElemService,
    ActDsioElemService,
    LibraryDsioElemService,
    PaymentDsioElemService,
    ImportDsioService,
    HandleDsioService,
    AmountDsioService,
    PreDataDsioService,
  ],
})
export class DsioModule {}
