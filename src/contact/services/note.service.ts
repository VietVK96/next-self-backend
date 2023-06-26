import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';
import { Repository } from 'typeorm';
import { StoreNoteDto } from '../dto/noteStore.dto';

@Injectable()
export class NoteService {
  constructor(
    @InjectRepository(ContactNoteEntity)
    private readonly repo: Repository<ContactNoteEntity>,
  ) {}
  async store(payload: StoreNoteDto) {
    return await this.repo.save(payload);
  }
}
