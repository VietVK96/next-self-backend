import { Module } from '@nestjs/common';
import { UserEntity } from 'src/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './statistics.controller';
import { StatisticsPaymentService } from './services/statistics.payment.service';
import { StatisticsService } from './services/statistic.service';
import { StatisticsPatientService } from './services/statistics.patient.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [StatisticsController],
  providers: [
    StatisticsPaymentService,
    StatisticsService,
    StatisticsPatientService,
  ],
})
export class StatisticsModule {}
