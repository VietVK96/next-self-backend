import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GlossaryEntity } from 'src/entities/glossary.entity';
import { DataSource, Repository } from 'typeorm';
import { FindGlossariesRes } from './responsive/find.glossaries.res';
import { GlossaryEntryEntity } from 'src/entities/glossary-entry.entity';
import { GlossaryEntryRes } from './responsive/glossaryEntry.glossaries.res';

@Injectable()
export class GlossariesService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(GlossaryEntity)
    private glossaryRepo: Repository<GlossaryEntity>,
    @InjectRepository(GlossaryEntryEntity)
    private glossaryEntryRepo: Repository<GlossaryEntryEntity>,
  ) {}

  // php/glossaries/index.php 100%
  async findGlossaries(): Promise<FindGlossariesRes[]> {
    const glossaries = await this.glossaryRepo.find();
    const res = glossaries.map((glossary) => {
      return {
        id: glossary.id,
        name: glossary.name,
        position: glossary.position,
        entry_count: glossary.entryCount,
      };
    });
    return res;
  }

  // php/glossaries/entries/index.php 100%
  async findGlossary(id: number): Promise<GlossaryEntryRes[]> {
    const glossaryEntries = await this.glossaryEntryRepo.findBy({
      glossaryId: id,
    });
    const res = glossaryEntries.map((glossaryEntry) => {
      return {
        id: glossaryEntry.id,
        content: glossaryEntry.content,
        position: glossaryEntry.position,
      };
    });
    return res;
  }

  async deleteGlossary(id: number): Promise<GlossaryEntryRes> {
    const glossaryEntry = await this.glossaryEntryRepo.findOneBy({ id });
    await this.glossaryEntryRepo.delete({ id });
    return {
      content: glossaryEntry.content,
      position: glossaryEntry.position,
    };
  }
}
