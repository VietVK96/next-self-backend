import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactEntity } from 'src/entities/contact.entity';
import { SaveContactController } from './save.patient.controller';
import { SaveContactService } from './services/save.patient.services';
// import { ContactEntity } from 'src/entities/contact.entity';
// import { FindContactController } from './find.contact.controller';
// import { FindContactService } from './services/find.contact.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContactEntity])],
  controllers: [SaveContactController],
  providers: [SaveContactService],
  exports: [TypeOrmModule],
})
export class SavePatienttModule {}