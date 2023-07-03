import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { UserEntity } from 'src/entities/user.entity';
import { PatientController } from './patient.controller';
import { PatientService } from './service/patient.service';
import { ContactEntity } from '../entities/contact.entity';
import { AddressEntity } from '../entities/address.entity';
import { PhoneEntity } from '../entities/phone.entity';
import { ContactModule } from 'src/contact/contact.module';
import { AddressModule } from 'src/address/address.module';

@Module({
  imports: [
    AddressModule,
    TypeOrmModule.forFeature([
      ContactEntity,
      UserEntity,
      OrganizationEntity,
      AddressEntity,
      PhoneEntity,
      ContactEntity,
    ]),
    forwardRef(() => ContactModule),
  ],
  controllers: [PatientController],
  providers: [PatientService],
  exports: [PatientService],
})
export class PatientModule {}
