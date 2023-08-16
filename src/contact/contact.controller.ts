import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { ContactDetailDto } from './dto/contact-detail.dto';
import { SaveUpdateContactService } from './services/saveUpdate.contact.service';
@ApiBearerAuth()
@Controller('/contact')
@ApiTags('Contacts')
export class ContactController {
  constructor(private saveUpdateContactService: SaveUpdateContactService) {}

  /**
   * php/contact/save.php 100%
   */
  @Post('/save')
  @UseGuards(TokenGuard)
  async savePatient(
    @Body() body: ContactDetailDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.saveUpdateContactService.saveContact(body, identity);
  }

  /**
   * php/contact/save.php 100%
   */
  @Patch('/save')
  @UseGuards(TokenGuard)
  async updatePatient(
    @Body() body: ContactDetailDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.saveUpdateContactService.updateContact(body, identity);
  }
}
