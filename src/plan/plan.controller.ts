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
  DuplicatePlanDto,
  FindAllStructDto,
  IdStructDto,
} from './dto/plan.dto';
import { PlanService } from './services/plan.service';

@ApiBearerAuth()
@Controller('plan')
@ApiTags('Plan')
export class PlanController {
  constructor(private planService: PlanService) {}

  // File /php/contact/plans/findAll.php
  @Get()
  @UseGuards(TokenGuard)
  async findAll(@Query() request: FindAllStructDto) {
    return this.planService.findAll(request);
  }

  // File /php/plan/delete.php
  @Delete()
  @UseGuards(TokenGuard)
  async deleteOne(
    @Query() request: IdStructDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.planService.deleteOne(request, identity);
  }

  //File /php/plan/find.php
  @Get('/get')
  @UseGuards(TokenGuard)
  async findOne(
    @Query() request: IdStructDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.planService.findOne(request, identity.org);
  }

  //File /php/plan.php
  @Post()
  @UseGuards(TokenGuard)
  async save(
    @Query() request: ActionSaveStructDto,
    @Body() body: BodySaveStructDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.planService.save(request, body, identity);
  }

  /**
   * php/plan/duplicate.php
   * Duplication d'un plan de traitement.
   */
  @Post('/duplicate')
  @UseGuards(TokenGuard)
  async duplicate(
    @Body() request: DuplicatePlanDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.planService.duplicate(request, identity?.org);
  }
}
