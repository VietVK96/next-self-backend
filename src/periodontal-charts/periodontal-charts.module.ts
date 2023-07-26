import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeriodontalChartsController } from './periodontal-charts.controller';
import { PeriodontalChartsService } from './services/periodontal-charts.service';
import { PeriodontalChartEntity } from 'src/entities/periodontal-chart.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PeriodontalChartEntity])],
  controllers: [PeriodontalChartsController],
  providers: [PeriodontalChartsService],
})
export class PeriodontalChartsModule {}
