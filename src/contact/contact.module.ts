import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactEntity } from 'src/entities/contact.entity';
import { FindContactController } from './find.contact.controller';
import { HistoricalController } from './historical.controller';
import { ContactService } from './services/contact.service';
import { FindContactService } from './services/find.contact.service';
import { HistoricalService } from './services/historical.service';
import { ActController } from './act.controller';
import { ActServices } from './services/act.service';
import { TraceabilityEntity } from 'src/entities/traceability.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ContactEntity, TraceabilityEntity])],
  controllers: [FindContactController, HistoricalController, ActController],
  providers: [
    FindContactService,
    HistoricalService,
    ContactService,
    ActServices,
  ],
})
export class ContactModule {}
