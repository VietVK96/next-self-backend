import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SaveStickNoteDto } from './dto/save.sticky-note.dto';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { DeleteStickyNoteDto } from './dto/delete.sticky-note.dto';
import { FindAllStickyNoteDto } from './dto/findAll.sticky-note.dto';
import { StickyNoteService } from './services/stickyNote.service';

@ApiBearerAuth()
@ApiTags('StickyNote')
@Controller('/stickyNote')
export class StickyNoteController {
  constructor(private stickyNoteService: StickyNoteService) {}

  @Post('/save')
  @ApiBody({
    type: SaveStickNoteDto,
  })
  @UseGuards(TokenGuard)
  async save(
    @Body() reqBody: SaveStickNoteDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.stickyNoteService.save(reqBody, identity.id, identity.org);
  }

  @Post('/delete')
  @ApiQuery({
    name: 'deleteReq',
    type: DeleteStickyNoteDto,
  })
  @UseGuards(TokenGuard)
  async delete(
    @Query() request: DeleteStickyNoteDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.stickyNoteService.delete(Number(request.id), identity.id);
  }

  @Get('/findAll')
  @ApiQuery({
    name: 'contact',
    type: FindAllStickyNoteDto,
  })
  @UseGuards(TokenGuard)
  async findAll(
    @Query() request: FindAllStickyNoteDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.stickyNoteService.findAll(Number(request.contact), identity.id);
  }
}
