import {
  Body,
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  Get,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NoteService } from './services/note.service';
import { StoreNoteDto } from './dto/noteStore.dto';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { SuccessResponse } from 'src/common/response/success.res';

@ApiBearerAuth()
@Controller('/contact')
@ApiTags('')
export class NoteController {
  constructor(private service: NoteService) {}
  // php/contact/note/store.php
  @Post('note/add')
  @UseGuards(TokenGuard)
  async store(
    @Body() body: StoreNoteDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.service.store(body, identity);
  }

  /**
   * /php/contact/note/delete.php 23->39
   * delete contact not
   */
  @Delete('note/:id')
  @UseGuards(TokenGuard)
  async deleteNote(
    @CurrentUser() identity: UserIdentity,
    @Param('id') id: number,
  ): Promise<SuccessResponse> {
    await this.service.deleteByID(id);
    return {
      success: true,
    };
  }

  /**
   * php/contact/note/find.php 14->20
   * get contact note by id
   */
  @Get('note/:id')
  @UseGuards(TokenGuard)
  async getNote(
    @CurrentUser() identity: UserIdentity,
    @Param('id') id: number,
  ) {
    return await this.service.findByID(id);
  }
}
