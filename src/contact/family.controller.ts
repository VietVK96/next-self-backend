import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
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
import { UploadService } from 'src/upload/services/upload.service';
@ApiBearerAuth()
@Controller('/contact')
@ApiTags('Contact')
export class FamilyController {
  constructor(
    private familyService: FamilyService,
    private uploadService: UploadService,
  ) {}

  @Post('/family')
  @UseGuards(TokenGuard)
  async contactFamily(
    @Body() payload: FamilyContactDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.familyService.contactFamily(payload, identity);
  }

  @Delete('/picture/:contact')
  @UseGuards(TokenGuard)
  async deletePatientPhoto(
    @CurrentUser() user: UserIdentity,
    @Param('contact') contact: number,
  ) {
    return await this.uploadService.deletePatientPhoto(user, contact);
  }
}
