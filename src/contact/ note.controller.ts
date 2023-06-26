import { Body, Controller, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { NoteService } from './services/note.service';
import { StoreNoteDto } from './dto/noteStore.dto';
@ApiBearerAuth()
@Controller('/note')
@ApiTags('')
export class NoteController {
  constructor(private service: NoteService) {}
  @Post('/add')
  @UseGuards(TokenGuard)
  async store(@Body() body: StoreNoteDto) {
    return this.service.store(body);
  }
}
