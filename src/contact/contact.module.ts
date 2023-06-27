import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactEntity } from 'src/entities/contact.entity';
import { FindContactController } from './find.contact.controller';
import { HistoricalController } from './historical.controller';
import { ContactService } from './services/contact.service';
import { FindContactService } from './services/find.contact.service';
import { HistoricalService } from './services/historical.service';
import { ContactPaymentService } from './services/contact.payment.service';
import { ContactPaymentController } from './contact.payment.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ContactEntity])],
  controllers: [
    FindContactController,
    HistoricalController,
    ContactPaymentController,
  ],
  providers: [
    FindContactService,
    HistoricalService,
    ContactService,
    ContactPaymentService,
  ],
})
export class ContactModule {}
