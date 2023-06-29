import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { UserService } from './services/user.service';
import { AddressModule } from 'src/address/address.module';
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), AddressModule],
  controllers: [],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
