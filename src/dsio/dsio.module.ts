import { Module } from '@nestjs/common';
import { DsioController } from './dsio.controller';
import { DsioImporterService } from './services/dsio-importer.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { ImporterService } from './services/importer.service';
import { DsioService } from './services/dsio.service';
import { CommandModule } from 'src/command/command.module';
import { DsioElemService } from './services/dsio.elem.service';
import { ConfigService } from './services/config.service';
import { LetterImporterService } from './services/letter-importer.service';
import { UserEntity } from 'src/entities/user.entity';
import { ContactEntity } from 'src/entities/contact.entity';
import { LettersEntity } from 'src/entities/letters.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserPreferenceEntity,
      UserEntity,
      ContactEntity,
      LettersEntity,
    ]),
    CommandModule,
  ],

  controllers: [DsioController],
  providers: [
    DsioImporterService,
    ImporterService,
    DsioService,
    DsioElemService,
    ConfigService,
    LetterImporterService,
  ],
})
export class DsioModule {}
