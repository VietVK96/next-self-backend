import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { ContactNoteServices } from './services/note.service';
import { SuccessResponse } from 'src/common/response/success.res';

@ApiBearerAuth()
@Controller('/contact')
@ApiTags('Contact')
export class ContactNoteController {
  constructor(private contactNoteService: ContactNoteServices) {}

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
    await this.contactNoteService.deleteByID(id);
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
    return await this.contactNoteService.findByID(id);
  }
}
