import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StickyNoteEntity } from 'src/entities/sticky-note.entity';
import { StickyNoteController } from './sticky-note.controller';
import { StickyNoteService } from './sticky-note.service';

@Module({
  imports: [TypeOrmModule.forFeature([StickyNoteEntity])],
  controllers: [StickyNoteController],
  providers: [StickyNoteService],
})
export class StickyNoteModule {}
