import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { FamilyContactDto } from './dto/family.contact.dto';
import { FamilyService } from './services/family.service';
@ApiBearerAuth()
@Controller('/contact')
@ApiTags('Contact')
export class FamilyController {
  constructor(private familyService: FamilyService) {}

  @Post('/family')
  @UseGuards(TokenGuard)
  async contactFamily(
    @Body() payload: FamilyContactDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.familyService.contactFamily(payload, identity);
  }
}
