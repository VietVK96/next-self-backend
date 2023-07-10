import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanPlfEntity } from 'src/entities/plan-plf.entity';
import { PlantPlfController } from './plan-plf.controller';
import { PlantPlfService } from './services/planplf.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlanPlfEntity])],
  controllers: [PlantPlfController],
  providers: [PlantPlfService],
})
export class PlanPlfModule {}
