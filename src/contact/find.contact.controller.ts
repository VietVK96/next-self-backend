import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiHeader } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { CurrentDoctor } from 'src/common/decorator/doctor.decorator';
import { FindAllContactDto } from './dto/findAll.contact.dto';
import { ContactService } from './services/contact.service';
import { FindContactService } from './services/find.contact.service';

@ApiBearerAuth()
@Controller('/contact')
@ApiTags('Contact')
export class FindContactController {
  constructor(
    private findContactService: FindContactService,
    private contactService: ContactService,
  ) {}

  // File php\contact\findAll.php 1->8
  @Get()
  @ApiQuery({
    name: 'conditions',
    type: FindAllContactDto,
  })
  @ApiHeader({
    name: 'X-DoctorId',
    description: 'DoctorId',
  })
  @UseGuards(TokenGuard)
  async findAll(
    @Query() request: FindAllContactDto,
    @CurrentDoctor() doctorId: number,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.findContactService.findAll(request, doctorId, identity.org);
  }

  @Get('find/:id')
  @ApiQuery({
    name: 'conditions',
    type: FindAllContactDto,
  })
  @ApiHeader({
    name: 'X-DoctorId',
    description: 'DoctorId',
  })
  @UseGuards(TokenGuard)
  async findOne(
    @CurrentDoctor() doctorId: number,
    @Param('id') id: number,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.contactService.findOne(id, doctorId, identity);
  }

  // File php\contact\recentlyTreated\findAll.php 1->8
  @Get('/recentlyTreated')
  @UseGuards(TokenGuard)
  async findAllRecentlyTreated(@Query('practitioner') practitioner?: number) {
    return this.findContactService.findAllRecentlyTreated(practitioner);
  }
}
