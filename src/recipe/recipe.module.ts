import { Module } from '@nestjs/common';
import { RecipeService } from './services/recipe.service';
import { RecipeController } from './recipe.controller';

@Module({
  controllers: [RecipeController],
  providers: [RecipeService],
})
export class RecipeModule {}
