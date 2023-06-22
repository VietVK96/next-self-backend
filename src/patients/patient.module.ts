import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { UserEntity } from 'src/entities/user.entity';
import { PatientController } from './patient.controller';
import { PatientService } from './service/patient.service';
import { ContactEntity } from '../entities/contact.entity';
import { AddressEntity } from '../entities/address.entity';
import { PhoneEntity } from '../entities/phone.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContactEntity,
      UserEntity,
      OrganizationEntity,
      AddressEntity,
      PhoneEntity,
    ]),
  ],
  controllers: [PatientController],
  providers: [PatientService],
})
export class PatientModule {}
