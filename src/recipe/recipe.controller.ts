import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RecipeService } from './services/recipe.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QueryParamsDto } from './dto/query-recipe.dto';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';

@Controller('recipe')
@ApiTags('Recipe')
@ApiBearerAuth()
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  /**
   * File: php/recipe/findAll.php 100%.
   */
  @Get()
  @UseGuards(TokenGuard)
  findAll(
    @Query() queryParams: QueryParamsDto,
    @CurrentUser() user: UserIdentity,
  ) {
    return this.recipeService.findAll(queryParams, user);
  }
}
