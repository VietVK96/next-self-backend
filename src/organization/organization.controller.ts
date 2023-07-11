import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Render,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrganizationService } from './service/organization.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';

import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';

@ApiTags('Organization')
@Controller('organization')
@ApiBearerAuth()
export class OrganizationController {
  constructor(private organizationService: OrganizationService) {}

  /**
   * php/organizations/about.php -> full
   *
   */
  @Get('/about')
  @Render('src/partial/organizations/about.html.twig')
  @UseGuards(TokenGuard)
  async about(@CurrentUser() identity: UserIdentity) {
    try {
      return await this.organizationService.about(identity);
    } catch (error) {
      throw new CBadRequestException('error get about organization', error);
    }
  }
}
