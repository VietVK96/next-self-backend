import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { NoteService } from './services/note.service';
import { StoreNoteDto } from './dto/noteStore.dto';
@ApiBearerAuth()
@Controller('/note')
@ApiTags('')
export class NoteController {
  constructor(private service: NoteService) {}
  // php/contact/note/store.php
  @Post('/add')
  @UseGuards(TokenGuard)
  async store(@Body() body: StoreNoteDto) {
    return this.service.store(body);
  }
}
