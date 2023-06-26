import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactEntity } from 'src/entities/contact.entity';
import { FindContactController } from './find.contact.controller';
import { HistoricalController } from './historical.controller';
import { ContactService } from './services/contact.service';
import { FindContactService } from './services/find.contact.service';
import { HistoricalService } from './services/historical.service';
import { NoteService } from './services/note.service';
import { NoteController } from './ note.controller';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ContactEntity, ContactNoteEntity])],
  controllers: [FindContactController, HistoricalController, NoteController],
  providers: [
    FindContactService,
    HistoricalService,
    ContactService,
    NoteService,
  ],
})
export class ContactModule {}
