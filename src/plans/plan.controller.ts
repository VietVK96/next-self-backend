import { Controller, Delete, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { FindAllStructDto, IdStructDto } from './dto/plan.dto';
import { PlanService } from './services/plan.service';

@ApiBearerAuth()
@Controller('/contact/plan/all')
@ApiTags('Plan')
export class PlanController {
  constructor(private planService: PlanService) {}

  // File /php/contact/plans/findAll.php
  @Get()
  @UseGuards(TokenGuard)
  async findAll(@Query() request: FindAllStructDto) {
    return this.planService.findAll(request);
  }

  @Delete()
  @UseGuards(TokenGuard)
  async deleteOne(
    @Query() request: IdStructDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.planService.deleteOne(request, identity);
  }

  @Get('/get')
  @UseGuards(TokenGuard)
  async findOne(
    @Query() request: IdStructDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.planService.findOne(request, identity.org);
  }
}
