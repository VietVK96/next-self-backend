import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TrashContactService } from './services/trash.contact.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';

@Controller('trash/contact')
@ApiBearerAuth()
@ApiTags('Trash/Contact')
export class TrashContactController {
  constructor(private readonly trashContactService: TrashContactService) {}

  @Get()
  @UseGuards(TokenGuard)
  async findAll(
    @CurrentUser() identity: UserIdentity,
    @Query('start') start: number,
    @Query('length') length: number,
  ) {
    console.log('hihi');

    return await this.trashContactService.findAll(identity.org, start, length);
  }
}
