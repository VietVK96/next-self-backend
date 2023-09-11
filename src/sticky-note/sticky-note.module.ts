import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StickyNoteEntity } from 'src/entities/sticky-note.entity';
import { StickyNoteController } from './sticky-note.controller';
import { StickyNoteService } from './services/stickyNote.service';
import { FsdStickyNoteController } from './fsd.stickyNote.controller';
import { FsdSticktNoteService } from './services/fsd.stickyNote.service';

@Module({
  imports: [TypeOrmModule.forFeature([StickyNoteEntity])],
  controllers: [StickyNoteController, FsdStickyNoteController],
  providers: [StickyNoteService, FsdSticktNoteService],
})
export class StickyNoteModule {}
