import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StickyNoteEntity } from 'src/entities/sticky-note.entity';
import { StickyNoteController } from './stickyNote.controller';
import { StickyNoteService } from './stickyNote.service';

@Module({
  imports: [TypeOrmModule.forFeature([StickyNoteEntity])],
  controllers: [StickyNoteController],
  providers: [StickyNoteService],
})
export class StickyNoteModule {}
