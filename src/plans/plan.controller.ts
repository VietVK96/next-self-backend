import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiHeader } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { FindAllStructDto } from './dto/plan.dto';
import { PlanService } from './services/plan.service';

@ApiBearerAuth()
@Controller('/plan')
@ApiTags('Plan')
export class PlanController {
  constructor(private PlanService: PlanService) {}

  // File php\contact\findAll.php 1->8
  @Get()
  @UseGuards(TokenGuard)
  async findAll(
    @Query() request: FindAllStructDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    console.log(1);
    return this.PlanService.findAll(request, identity.org);
  }
}
