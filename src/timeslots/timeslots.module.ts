import { Module } from '@nestjs/common';
import { TimeslotEntity } from 'src/entities/timeslot.entity';
import { TimeslotController } from './timeslots.controller';
import { TimeslotsService } from './services/timeslots.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([TimeslotEntity])],
  controllers: [TimeslotController],
  providers: [TimeslotsService],
})
export class TimeslotsModule {}
