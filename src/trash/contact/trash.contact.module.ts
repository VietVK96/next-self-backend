import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactEntity } from 'src/entities/contact.entity';
import { TrashContactController } from './trash.contact.controller';
import { TrashContactService } from './services/trash.contact.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContactEntity])],
  controllers: [TrashContactController],
  providers: [TrashContactService],
})
export class TrashContactModule {}
