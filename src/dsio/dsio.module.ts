import { Module } from '@nestjs/common';
import { DsioController } from './dsio.controller';
import { DsioImporterService } from './services/dsio-importer.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { ImporterService } from './services/importer.service';
import { DsioService } from './services/dsio.service';
import { CommandModule } from 'src/command/command.module';
import { DsioElemService } from './services/dsio.elem.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserPreferenceEntity]), CommandModule],
  controllers: [DsioController],
  providers: [
    DsioImporterService,
    ImporterService,
    DsioService,
    DsioElemService,
  ],
})
export class DsioModule {}
