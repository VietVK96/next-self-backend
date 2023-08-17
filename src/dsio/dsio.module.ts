import { Module } from '@nestjs/common';
import { DsioController } from './dsio.controller';
import { DsioImporterService } from './services/dsio-importer.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { ImporterService } from './services/importer.service';
import { ImportDsioService } from './services/import-dsio.service';
import { CommandModule } from 'src/command/command.module';
import { DsioElemService } from './services/dsio.elem.service';
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
    DsioImporterService,
    ImporterService,
    ImportDsioService,
    DsioElemService,
    LetterImporterService,
    HandleDsioService,
    AmountDsioService,
    PreDataDsioService,
  ],
})
export class DsioModule {}
