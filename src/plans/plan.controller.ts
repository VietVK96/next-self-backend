import {
  Body,
  Controller,
  Delete,
  Get,
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
import {
  ActionSaveStructDto,
  BodySaveStructDto,
  FindAllStructDto,
  IdStructDto,
} from './dto/plan.dto';
import { PlanService } from './services/plan.service';

@ApiBearerAuth()
@Controller('plan')
@ApiTags('Plan')
export class PlanController {
  constructor(private PlanService: PlanService) {}

  // File /php/contact/plans/findAll.php
  @Get()
  @UseGuards(TokenGuard)
  async findAll(@Query() request: FindAllStructDto) {
    return this.PlanService.findAll(request);
  }

  @Delete()
  @UseGuards(TokenGuard)
  async deleteOne(
    @Query() request: IdStructDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.PlanService.deleteOne(request, identity);
  }

  @Get('/get')
  @UseGuards(TokenGuard)
  async findOne(
    @Query() request: IdStructDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.PlanService.findOne(request, identity.org);
  }

  @Post()
  @UseGuards(TokenGuard)
  async save(
    @Query() request: ActionSaveStructDto,
    @Body() body: BodySaveStructDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.PlanService.save(request, body, identity);
  }
}
