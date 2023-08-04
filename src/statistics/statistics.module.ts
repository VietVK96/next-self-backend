import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsService } from './services/statistics.service';
import { StatisticsController } from './statistics.controller';
import { StatisticsActsService } from './services/statistics.acts.service';
import { StatisticsEventsService } from './services/statistics.events.service';
import { StatisticsPaymentService } from './services/statistics.payment.service';
import { StatisticsPatientService } from './services/statistics.patient.service';
import { UserEntity } from 'src/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [StatisticsController],
  providers: [
    StatisticsService,
    StatisticsActsService,
    StatisticsEventsService,
    StatisticsPaymentService,
    StatisticsPatientService,
  ],
})
export class StatisticsModule {}
