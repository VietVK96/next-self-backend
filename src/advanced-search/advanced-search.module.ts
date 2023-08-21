import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchEntity } from 'src/entities/search.entity';
import { AdvancedSearchController } from './advanced-search.controller';
import { AdvanceSearchService } from './services/advanced-search.service';

@Module({
  imports: [TypeOrmModule.forFeature([SearchEntity])],
  controllers: [AdvancedSearchController],
  providers: [AdvanceSearchService],
})
export class AdvanceSearchModule {}
