import {
  Controller,
  Delete,
  Get,
  Headers,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiHeader } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { DeleteOneStructDto, FindAllStructDto } from './dto/plan.dto';
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
    return this.PlanService.findAll(request, identity.org);
  }

  @Delete()
  @UseGuards(TokenGuard)
  async deleteOne(
    @Query() request: DeleteOneStructDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.PlanService.deleteOne(request, identity);
  }
}
