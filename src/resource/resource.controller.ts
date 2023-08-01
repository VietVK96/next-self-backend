import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResourceService } from './services/resource.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { identity } from 'rxjs';

@ApiTags('Resource')
@Controller('resources')
@ApiBearerAuth()
export class ResourceController {
  constructor(private resourceService: ResourceService) {}

  @Get()
  @UseGuards(TokenGuard)
  async findAll(@CurrentUser() identity: UserIdentity) {
    return await this.resourceService.findAll(identity.org);
  }
}
