import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResourceService } from './services/resource.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { CreateResourceDto } from './dto/createResource.dto';
import { UpdateResourceDto } from './dto/updateResource.dto';

@ApiTags('Resource')
@Controller('resources')
@ApiBearerAuth()
export class ResourceController {
  constructor(private resourceService: ResourceService) {}

  /**
   * /settings/resources/index.php 1->17
   * @param identity
   * @returns
   */
  @Get()
  @UseGuards(TokenGuard)
  async findAll(@CurrentUser() identity: UserIdentity) {
    return await this.resourceService.findAll(identity?.org);
  }

  @Get('/edit')
  @UseGuards(TokenGuard)
  async find(
    @Query('id') idResource: number,
    @CurrentUser() identity: UserIdentity,
  ) {
    return await this.resourceService.find(idResource, identity);
  }
  /**
   * /settings/resources/create.php 1->19
   * @param identity
   * @returns
   */
  @Get('/create')
  @UseGuards(TokenGuard)
  async findAllUsersAndPractitioners(@CurrentUser() identity: UserIdentity) {
    return await this.resourceService.findAllUsersAndPractitioners(identity);
  }

  @Post('/store')
  @UseGuards(TokenGuard)
  async createResource(
    @Body() payload: CreateResourceDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return await this.resourceService.save(payload, identity);
  }

  @Patch('/update')
  @UseGuards(TokenGuard)
  async updateResource(
    @CurrentUser() identity: UserIdentity,
    @Body() payload: UpdateResourceDto,
  ) {
    return await this.resourceService.update(identity, payload);
  }
}
