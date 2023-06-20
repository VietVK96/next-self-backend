import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiHeader } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { FindAllContactDto } from './dto/findAll.contact.dto';
import { FindContactService } from './services/find.contact.service';

@ApiBearerAuth()
@Controller('/contact')
@ApiTags('Contact')
export class FindContactController {
  constructor(private findContactService: FindContactService) {}

  // File php\contact\findAll.php 1->8
  @Get()
  @ApiQuery({
    name: 'conditions',
    type: FindAllContactDto,
  })
  @ApiHeader({
    name: 'X-DocterId',
    description: 'DocterId',
  })
  @UseGuards(TokenGuard)
  async findAll(
    @Query() request: FindAllContactDto,
    @Headers('X-DocterId') docterId: number,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.findContactService.findAll(request, docterId, identity.org);
  }
}
