import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlossriesController } from './glossaries.controller';
import { GlossariesService } from './glossaries.service';
import { GlossaryEntity } from 'src/entities/glossary.entity';
import { GlossaryEntryEntity } from 'src/entities/glossary-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GlossaryEntity, GlossaryEntryEntity])],
  controllers: [GlossriesController],
  providers: [GlossariesService],
})
export class GlossariesModule {}
