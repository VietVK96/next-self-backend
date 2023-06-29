import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressEntity } from 'src/entities/address.entity';
import { AddressService } from './service/address.service';
@Module({
  imports: [TypeOrmModule.forFeature([AddressEntity])],
  controllers: [],
  providers: [AddressService],
  exports: [AddressService],
})
export class AddressModule {}
