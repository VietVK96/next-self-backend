import { Module } from '@nestjs/common';
import { DsioController } from './dsio.controller';
import { DsioService } from './services/dsio.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { ImporterService } from './services/importer.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserPreferenceEntity])],
  controllers: [DsioController],
  providers: [DsioService, ImporterService],
})
export class DsioModule {}
