import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactEntity } from 'src/entities/contact.entity';
import { FindContactController } from './find.contact.controller';
import { HistoricalController } from './historical.controller';
import { ContactService } from './services/contact.service';
import { FindContactService } from './services/find.contact.service';
import { HistoricalService } from './services/historical.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContactEntity])],
  controllers: [FindContactController, HistoricalController],
  providers: [FindContactService, HistoricalService, ContactService],
})
export class ContactModule {}
