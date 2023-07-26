import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsService } from './services/statistics.service';
import { StatisticsController } from './statistics.controller';
import { StatisticsActsService } from './services/statistics.acts.service';
import { StatisticsEventsService } from './services/statistics.events.service';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [StatisticsController],
  providers: [
    StatisticsService,
    StatisticsActsService,
    StatisticsEventsService,
  ],
})
export class StatisticsModule {}
