import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FindAllContactDto } from './dto/findAll.contact.dto';
import { FindContactService } from './services/find.contact.service';

@Controller('/contact')
@ApiTags('Contact')
export class FindContactController {
  constructor(private findContactService: FindContactService) {}

  // File php\contact\findAll.php 1->8
  @Get()
  async findAll(@Query() request: FindAllContactDto) {
    return this.findContactService.findAll(request, 1);
  }

  // File php\contact\recentlyTreated\findAll.php 1->8
  @Get('/recentlyTreated')
  async findAllRecentlyTreated(@Query('practitioner') practitioner?: number) {
    return this.findContactService.recentlyTreated(practitioner);
  }
}
