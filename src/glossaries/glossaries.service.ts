import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GlossaryEntity } from 'src/entities/glossary.entity';
import { DataSource, Repository } from 'typeorm';
import { FindGlossariesRes } from './responsive/find.glossaries.res';
import { GlossaryEntryEntity } from 'src/entities/glossary-entry.entity';
import { GlossaryEntryRes } from './responsive/glossaryEntry.glossaries.res';
import { saveGlossaryEntryPayload } from './dto/saveEntry.glossaries.dto';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { SaveGlossaryDto } from './dto/save.glossaries.dto';
import { MAX_ENTRIES, MAX_GLOSSARY } from 'src/constants/glassary';
import { SortGlossaryDto, UpdateGlossaryDto } from './dto/update.glossary.dto';
import { UpdateGlossaryEntryDto } from './dto/update.glossaryEntry.dto';
import { ErrorCode } from 'src/constants/error';
import { SuccessResponse } from 'src/common/response/success.res';

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
    const glossaries = await this.glossaryRepo.find({
      order: { position: 'ASC', id: 'ASC' },
    });
    const res = glossaries.map((glossary) => {
      return this.convertToGlossaryRes(glossary);
    });
    return res;
  }

  // php/glossaries/entries/index.php 100%
  async findGlossary(id: number): Promise<GlossaryEntryRes[]> {
    const glossaryEntries = await this.glossaryEntryRepo.findBy({
      glossaryId: id,
    });
    const res = glossaryEntries.map((glossaryEntry) => {
      return this.convertToGlossaryEntryRes(glossaryEntry);
    });
    return res;
  }

  async deleteGlossaryEntry(id: number): Promise<GlossaryEntryRes> {
    const glossaryEntry = await this.glossaryEntryRepo.findOne({
      where: { id },
      relations: { glossary: true },
    });
    await this.glossaryEntryRepo.delete({ id });

    const glossary: GlossaryEntity = await this.glossaryRepo.findOne({
      where: { id: glossaryEntry.glossary.id },
      relations: {
        entries: true,
      },
    });
    glossary.entryCount = glossary.entries.length;
    await this.glossaryRepo.save(glossary);

    return {
      content: glossaryEntry.content,
      position: glossaryEntry.position,
    };
  }

  async saveGlossaryEntry(
    payload: saveGlossaryEntryPayload,
    orgId: number,
  ): Promise<GlossaryEntryRes> {
    const count = await this.glossaryEntryRepo.count({
      where: { glossaryId: Number(payload.glossary) },
    });
    if (count >= MAX_ENTRIES) {
      // `Le nombre maximal d'entrée du glossaire a été atteint (max=${MAX_ENTRIES})`,

      throw new CBadRequestException(ErrorCode.MAXIMUM.concat('_ENTREE'));
    }

    const lastGlossaryEntry: GlossaryEntryEntity[] =
      await this.dataSource.query(
        `SELECT * FROM glossary_entry WHERE glossary_id = ? ORDER BY position DESC LIMIT 1`,
        [orgId],
      );
    const glossaryEntry = new GlossaryEntryEntity();
    glossaryEntry.glossaryId = Number(payload.glossary);
    glossaryEntry.organizationId = orgId;
    glossaryEntry.content = payload.content;
    glossaryEntry.position =
      lastGlossaryEntry.length !== 0 ? lastGlossaryEntry[0].position + 1 : 0;
    const newGlossaryEntry: GlossaryEntryEntity =
      await this.glossaryEntryRepo.save(glossaryEntry);
    const glossary: GlossaryEntity = await this.glossaryRepo.findOne({
      where: { id: Number(payload.glossary) },
      relations: {
        entries: true,
      },
    });
    glossary.entryCount = glossary.entries.length;
    await this.glossaryRepo.save(glossary);
    return this.convertToGlossaryEntryRes(newGlossaryEntry);
  }

  async saveGlossary(
    payload: SaveGlossaryDto,
    orgId: number,
  ): Promise<FindGlossariesRes> {
    const count = await this.glossaryRepo.count();
    if (count >= MAX_GLOSSARY) {
      // `Le nombre maximal de glossaire a été atteint (max=${MAX_GLOSSARY}).`,

      throw new CBadRequestException(ErrorCode.MAXIMUM);
    }

    const lastGlossary: GlossaryEntity[] = await this.dataSource.query(
      `SELECT * FROM glossary ORDER BY position DESC LIMIT 1`,
    );
    const glossary = new GlossaryEntity();
    glossary.name = payload.name;
    glossary.organizationId = orgId;
    glossary.entryCount = 0;
    glossary.position =
      lastGlossary.length !== 0 ? lastGlossary[0].position + 1 : 0;
    const newGlossary: GlossaryEntity = await this.glossaryRepo.save(glossary);
    return this.convertToGlossaryRes(newGlossary);
  }

  private convertToGlossaryEntryRes(e: GlossaryEntryEntity): GlossaryEntryRes {
    return {
      id: e.id,
      content: e.content,
      position: e.position,
    };
  }

  private convertToGlossaryRes(e: GlossaryEntity): FindGlossariesRes {
    return {
      id: e.id,
      name: e.name,
      position: e.position,
      entry_count: e.entryCount,
    };
  }

  async deleteGlossary(id: number): Promise<SuccessResponse> {
    const glossary = await this.glossaryRepo.findOne({ where: { id } });
    if (!glossary) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }
    await this.glossaryRepo.remove(glossary);
    return {
      success: true,
    };
  }

  async updateGlossary(id: number, payload: UpdateGlossaryDto) {
    const glossary = await this.glossaryRepo.findOne({ where: { id } });
    if (!glossary) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }
    return await this.glossaryRepo.save({ ...glossary, name: payload?.name });
  }

  async updateGlossaryEntry(payload: UpdateGlossaryEntryDto, id: number) {
    const glossaryEntry = await this.glossaryEntryRepo.findOne({
      where: { id },
    });
    if (!glossaryEntry) {
      throw new CBadRequestException(ErrorCode.STATUS_NOT_FOUND);
    }

    try {
      await this.glossaryEntryRepo.save({
        ...glossaryEntry,
        content: payload?.content,
      });
    } catch (error) {
      throw new CBadRequestException(ErrorCode.SAVE_FAILED);
    }
  }

  async sortable(payload: SortGlossaryDto[]) {
    const ids = payload.map((item) => item.id);
    let i = 0;
    for (const id of ids) {
      try {
        await this.dataSource
          .createQueryBuilder()
          .update(GlossaryEntity)
          .set({ position: i })
          .where({ id })
          .execute();
        i++;
      } catch (error) {}
    }
    return;
  }
}
