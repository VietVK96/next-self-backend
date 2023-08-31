import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressBookService } from './services/address-book.service';
import { AddressBookController } from './address-books.controller';
@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [AddressBookController],
  providers: [AddressBookService],
  exports: [AddressBookService],
})
export class AddressBookModule {}
