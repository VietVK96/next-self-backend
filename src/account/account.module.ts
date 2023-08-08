import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountController } from './account.controller';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';
import { CertificatService } from './services/certificat.service';
import { UserService } from 'src/user/services/user.service';
import { AddressService } from 'src/address/service/address.service';
import { UserEntity } from 'src/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserMedicalEntity, UserEntity])],
  controllers: [AccountController],
  providers: [CertificatService, UserService, AddressService],
})
export class AccountModule {}
